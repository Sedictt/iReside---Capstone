import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

type RawReportRow = {
    id: string;
    reporter_user_id: string;
    target_user_id: string;
    conversation_id: string | null;
    category: string;
    details: string;
    status: string;
    metadata: unknown;
    created_at: string;
};

type ReportScreenshotMeta = {
    bucket?: unknown;
    path?: unknown;
    fileName?: unknown;
    mimeType?: unknown;
    size?: unknown;
};

type ReportedMessageSnapshotMeta = {
    id?: unknown;
    conversationId?: unknown;
    senderId?: unknown;
    type?: unknown;
    content?: unknown;
    createdAt?: unknown;
};

type MessageRow = {
    id: string;
    conversation_id: string;
    sender_id: string;
    type: string;
    content: string;
    created_at: string;
};

const isJsonObject = (value: unknown): value is Record<string, unknown> =>
    Boolean(value) && typeof value === "object" && !Array.isArray(value);

async function assertAdmin() {
    const supabase = await createClient();
    const {
        data: { user },
        error,
    } = await supabase.auth.getUser();
    if (error || !user) return { user: null, error: "Unauthorized" as const };

    const adminClient = createAdminClient();
    const { data: profile } = await adminClient.from("profiles").select("role").eq("id", user.id).maybeSingle();
    if (profile?.role !== "admin") return { user: null, error: "Forbidden" as const };

    return { user, error: null };
}

export async function GET() {
    const auth = await assertAdmin();
    if (auth.error || !auth.user) {
        return NextResponse.json({ error: auth.error }, { status: auth.error === "Unauthorized" ? 401 : 403 });
    }

    const adminClient = createAdminClient();

    // Join message_user_reports with messages to get sender/conversation info
    // DB columns: message_user_reports has reporter_id, message_id; messages has sender_id, conversation_id
    const { data, error } = await adminClient
        .from("message_user_reports")
        .select(`
            id,
            message_id,
            reporter_id,
            reason,
            created_at,
            messages (
                id,
                sender_id,
                conversation_id
            )
        `)
        .order("created_at", { ascending: false })
        .limit(250);

    if (error) {
        return NextResponse.json({ error: "Failed to load chat moderation reports." }, { status: 500 });
    }

    // Transform to match RawReportRow shape (DB columns differ from type expectations)
    // TODO: align RawReportRow type with actual DB schema
    const raw = (data ?? []) as unknown as Array<{
        id: string;
        message_id: string;
        reporter_id: string;
        reason: string;
        created_at: string;
        messages: { id: string; sender_id: string; conversation_id: string } | null;
    }>;
    const rows: RawReportRow[] = raw.map((r) => ({
        id: r.id,
        reporter_user_id: r.reporter_id,
        target_user_id: r.messages?.sender_id ?? "",
        conversation_id: r.messages?.conversation_id ?? null,
        category: r.reason,
        details: "",
        status: "open",
        metadata: {
            reportedMessageId: r.message_id,
            conversationId: r.messages?.conversation_id ?? null,
        },
        created_at: r.created_at,
    }));

    const profileIds = Array.from(new Set(rows.flatMap((row) => [row.reporter_user_id, row.target_user_id])));
    const reportedMessageIds = Array.from(
        new Set(
            rows
                .map((row) => {
                    const metadata = isJsonObject(row.metadata) ? row.metadata : {};
                    return typeof metadata.reportedMessageId === "string" ? metadata.reportedMessageId : null;
                })
                .filter((value): value is string => Boolean(value))
        )
    );

    const { data: profileRows, error: profileError } = await adminClient
        .from("profiles")
        .select("id, full_name, email")
        .in("id", profileIds);

    if (profileError) {
        return NextResponse.json({ error: "Failed to load report profile details." }, { status: 500 });
    }

    const profileMap = new Map(
        ((profileRows ?? []) as Array<{ id: string; full_name: string | null; email: string | null }>).map((row) => [row.id, row])
    );
    const messageMap = new Map<string, MessageRow>();

    if (reportedMessageIds.length > 0) {
        const { data: messageRows, error: messageError } = await adminClient
            .from("messages")
            .select("id, conversation_id, sender_id, type, content, created_at")
            .in("id", reportedMessageIds);

        if (messageError) {
            return NextResponse.json({ error: "Failed to load reported message details." }, { status: 500 });
        }

        ((messageRows ?? []) as MessageRow[]).forEach((row) => {
            messageMap.set(row.id, row);
        });
    }

    const reports = await Promise.all(rows.map(async (row) => {
        const metadata = isJsonObject(row.metadata) ? row.metadata : {};
        const exactMessage = typeof metadata.exactMessage === "string" ? metadata.exactMessage : null;
        const reportedMessageId = typeof metadata.reportedMessageId === "string" ? metadata.reportedMessageId : null;
        const reportedMessageSnapshot = isJsonObject(metadata.reportedMessage)
            ? (metadata.reportedMessage as ReportedMessageSnapshotMeta)
            : null;
        const reportedMessageRow = reportedMessageId ? messageMap.get(reportedMessageId) : null;
        const screenshotsRaw = Array.isArray(metadata.screenshots) ? (metadata.screenshots as ReportScreenshotMeta[]) : [];
        const screenshots = await Promise.all(
            screenshotsRaw.map(async (entry) => {
                const bucket = typeof entry.bucket === "string" ? entry.bucket : "";
                const path = typeof entry.path === "string" ? entry.path : "";
                if (!bucket || !path) {
                    return null;
                }
                const { data: signed, error: signedError } = await adminClient.storage
                    .from(bucket)
                    .createSignedUrl(path, 60 * 30);

                if (signedError || !signed?.signedUrl) {
                    return null;
                }

                return {
                    fileName: typeof entry.fileName === "string" ? entry.fileName : "screenshot",
                    mimeType: typeof entry.mimeType === "string" ? entry.mimeType : "",
                    size: typeof entry.size === "number" ? entry.size : null,
                    url: signed.signedUrl,
                };
            })
        );

        return {
            id: row.id,
            conversationId: row.conversation_id,
            category: row.category,
            details: row.details,
            status: row.status,
            createdAt: row.created_at,
            exactMessage,
            reportedMessageId,
            reportedMessage: reportedMessageRow
                ? {
                      id: reportedMessageRow.id,
                      conversationId: reportedMessageRow.conversation_id,
                      senderId: reportedMessageRow.sender_id,
                      type: reportedMessageRow.type,
                      content: reportedMessageRow.content,
                      createdAt: reportedMessageRow.created_at,
                  }
                : reportedMessageSnapshot
                    ? {
                          id: typeof reportedMessageSnapshot.id === "string" ? reportedMessageSnapshot.id : reportedMessageId,
                          conversationId:
                              typeof reportedMessageSnapshot.conversationId === "string"
                                  ? reportedMessageSnapshot.conversationId
                                  : row.conversation_id,
                          senderId:
                              typeof reportedMessageSnapshot.senderId === "string"
                                  ? reportedMessageSnapshot.senderId
                                  : row.target_user_id,
                          type: typeof reportedMessageSnapshot.type === "string" ? reportedMessageSnapshot.type : "text",
                          content: typeof reportedMessageSnapshot.content === "string" ? reportedMessageSnapshot.content : "",
                          createdAt:
                              typeof reportedMessageSnapshot.createdAt === "string"
                                  ? reportedMessageSnapshot.createdAt
                                  : row.created_at,
                      }
                    : null,
            screenshots: screenshots.filter((entry): entry is NonNullable<typeof entry> => Boolean(entry)),
            reporter: profileMap.get(row.reporter_user_id)
                ? {
                      id: row.reporter_user_id,
                      name: profileMap.get(row.reporter_user_id)?.full_name ?? "Unknown",
                      email: profileMap.get(row.reporter_user_id)?.email ?? "",
                  }
                : null,
            target: profileMap.get(row.target_user_id)
                ? {
                      id: row.target_user_id,
                      name: profileMap.get(row.target_user_id)?.full_name ?? "Unknown",
                      email: profileMap.get(row.target_user_id)?.email ?? "",
                  }
                : null,
            metadata,
        };
    }));

    return NextResponse.json({ reports });
}
