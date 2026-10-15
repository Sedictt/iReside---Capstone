import { NextResponse } from "next/server";
import { requireAuthenticatedUser } from "@/lib/api/auth-guard";
import { parseSearchParams } from "@/lib/validation/server";
import { auditLogQuerySchema } from "@/lib/validation/schemas/operations.schema";
import { createServiceRoleSupabaseClient } from "@/lib/supabase/admin";
import type { AuditCategory, AuditSeverity } from "@/lib/audit/audit-logger";
import { describeAuditEvent } from "@/lib/audit/audit-display";

// A payment step can be logged twice: once as a payment workflow event and once in
// user_audit_logs. These pairs are the same thing, so only the user_audit_logs entry is kept.
const DUPLICATE_WORKFLOW_ACTIONS: Record<string, string> = {
    confirm_received: "PAYMENT_COLLECTED",
    reminder_sent: "INVOICE_REMINDER_SENT",
};
const DUPLICATE_WINDOW_MS = 5 * 60 * 1000;

export interface AuditLogItem {
    id: string;
    userId: string;
    userRole: string;
    action: string;
    category: AuditCategory;
    title: string;
    description: string;
    severity: AuditSeverity;
    targetId: string | null;
    targetType: string | null;
    metadata: Record<string, any>;
    createdAt: string;
    device?: string;
}

export async function GET(request: Request) {
    const authContext = await requireAuthenticatedUser(request);
    if (!("userId" in authContext)) return authContext as Response;
    const { userId } = authContext;

    const url = new URL(request.url);
    const parsedQuery = parseSearchParams(url.searchParams, auditLogQuerySchema);
    if (!parsedQuery.ok) return parsedQuery.response;
    const { category, severity, limit } = parsedQuery.data;
    const search = parsedQuery.data.search.toLowerCase();
    const isExport = parsedQuery.data.export === "csv";

    const adminClient = createServiceRoleSupabaseClient();
    const logs: AuditLogItem[] = [];

    try {
        // 1. Fetch direct user_audit_logs
        const { data: directLogs, error: directError } = await (adminClient as any)
            .from("user_audit_logs")
            .select("*")
            .eq("user_id", userId)
            .order("created_at", { ascending: false })
            .limit(limit);

        if (!directError && Array.isArray(directLogs)) {
            for (const item of directLogs) {
                const metadata = item.metadata || {};
                // Older rows were stored with technical wording; describe them from the action instead.
                const { title, description } = describeAuditEvent({ action: item.action, title: item.title, description: item.description, metadata });
                logs.push({
                    id: item.id,
                    userId: item.user_id,
                    userRole: item.user_role || "landlord",
                    action: item.action,
                    category: item.category || "general",
                    title,
                    description,
                    severity: item.severity || "info",
                    targetId: item.target_id,
                    targetType: item.target_type,
                    metadata,
                    createdAt: item.created_at,
                    device: item.user_agent || metadata.device || undefined,
                });
            }
        }

        // 2. Harmonize existing payment workflow audit events if present
        const { data: payments } = await adminClient
            .from("payments")
            .select("id, invoice_number, tenant_id, amount, paid_amount, status, workflow_status, created_at, updated_at")
            .eq("landlord_id", userId)
            .order("created_at", { ascending: false })
            .limit(50);

        if (payments && payments.length > 0) {
            const paymentIds = payments.map((p) => p.id);
            const { data: workflowEvents } = await adminClient
                .from("payment_workflow_audit_events")
                .select("id, payment_id, action, source, created_at, metadata, actor_id")
                .in("payment_id", paymentIds)
                .order("created_at", { ascending: false })
                .limit(50);

            if (workflowEvents) {
                const paymentMap = new Map(payments.map((p) => [p.id, p]));
                for (const ev of workflowEvents) {
                    const pairedAction = DUPLICATE_WORKFLOW_ACTIONS[ev.action];
                    if (pairedAction) {
                        const eventTime = new Date(ev.created_at).getTime();
                        const alreadyLogged = logs.some(
                            (log) =>
                                log.action === pairedAction &&
                                log.targetId === ev.payment_id &&
                                Math.abs(new Date(log.createdAt).getTime() - eventTime) <= DUPLICATE_WINDOW_MS
                        );
                        if (alreadyLogged) continue;
                    }

                    const pay = paymentMap.get(ev.payment_id);
                    const category: AuditCategory = "billing";
                    const severity: AuditSeverity = ev.action.includes("reject") ? "warning" : "info";
                    const evMetadata = (typeof ev.metadata === "object" && ev.metadata !== null ? ev.metadata : {}) as Record<string, any>;
                    const metadata = {
                        ...evMetadata,
                        source: ev.source,
                        invoiceNumber: pay?.invoice_number,
                        amount: pay?.amount,
                    };
                    const { title, description } = describeAuditEvent({ action: ev.action, title: "Payment update", metadata });

                    logs.push({
                        id: `wf-${ev.id}`,
                        userId,
                        userRole: "landlord",
                        action: ev.action,
                        category,
                        title,
                        description,
                        severity,
                        targetId: ev.payment_id,
                        targetType: "payment",
                        metadata,
                        createdAt: ev.created_at,
                    });
                }
            }
        }

        // Sort all aggregated logs chronologically descending
        logs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

        // Apply filters
        let filtered = logs;
        if (category && category !== "all") {
            filtered = filtered.filter((l) => l.category === category);
        }
        if (severity && severity !== "all") {
            filtered = filtered.filter((l) => l.severity === severity);
        }
        if (search) {
            filtered = filtered.filter(
                (l) =>
                    l.title.toLowerCase().includes(search) ||
                    l.description.toLowerCase().includes(search) ||
                    l.action.toLowerCase().includes(search) ||
                    (l.targetId && l.targetId.toLowerCase().includes(search))
            );
        }

        // CSV Export Mode
        if (isExport) {
            const csvRows = [
                ["ID", "Timestamp (UTC)", "Category", "Severity", "Action", "Title", "Description", "Device", "Target ID"].join(","),
                ...filtered.map((log) => [
                    `"${log.id}"`,
                    `"${log.createdAt}"`,
                    `"${log.category}"`,
                    `"${log.severity}"`,
                    `"${log.action}"`,
                    `"${log.title.replace(/"/g, '""')}"`,
                    `"${log.description.replace(/"/g, '""')}"`,
                    `"${(log.device || "").replace(/"/g, '""')}"`,
                    `"${log.targetId || "N/A"}"`,
                ].join(",")),
            ];

            const csvContent = csvRows.join("\n");
            return new Response(csvContent, {
                status: 200,
                headers: {
                    "Content-Type": "text/csv; charset=utf-8",
                    "Content-Disposition": `attachment; filename="ireside-audit-log-${new Date().toISOString().split("T")[0]}.csv"`,
                },
            });
        }

        // Summary Statistics for Dashboard / Settings UI
        const stats = {
            total: logs.length,
            billingCount: logs.filter((l) => l.category === "billing").length,
            securityCount: logs.filter((l) => l.category === "security").length,
            settingsCount: logs.filter((l) => l.category === "settings").length,
            propertiesCount: logs.filter((l) => l.category === "properties").length,
        };

        return NextResponse.json({
            ok: true,
            logs: filtered,
            stats,
            totalCount: filtered.length,
        });
    } catch (err: any) {
        console.error("Error retrieving audit logs:", err);
        return NextResponse.json(
            { error: "Failed to retrieve audit logs." },
            { status: 500 }
        );
    }
}
