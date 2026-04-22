import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

type CreateTermBody = {
    term?: string;
    reportId?: string | null;
};

const normalizeTerm = (value: string) => value.normalize("NFKC").toLowerCase().replace(/\s+/g, " ").trim();
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

    const adminClient = createAdminClient() as any;
    const { data, error } = await adminClient
        .from("message_moderation_banned_terms")
        .select("id, term, normalized_term, source, report_id, is_active, created_at")
        .order("created_at", { ascending: false })
        .limit(500);

    if (error) {
        return NextResponse.json({ error: "Failed to load banned terms." }, { status: 500 });
    }

    const terms = (data ?? []).map((row: any) => ({
        id: row.id as string,
        term: row.term as string,
        normalizedTerm: row.normalized_term as string,
        source: row.source as string,
        reportId: (row.report_id as string | null) ?? null,
        isActive: Boolean(row.is_active),
        createdAt: row.created_at as string,
    }));

    return NextResponse.json({ terms });
}

export async function POST(request: Request) {
    const auth = await assertAdmin();
    if (auth.error || !auth.user) {
        return NextResponse.json({ error: auth.error }, { status: auth.error === "Unauthorized" ? 401 : 403 });
    }

    const body = (await request.json().catch(() => null)) as CreateTermBody | null;
    const rawTerm = (body?.term ?? "").trim();
    const normalizedTerm = normalizeTerm(rawTerm);
    const reportId = (body?.reportId ?? null)?.trim() || null;

    if (normalizedTerm.length < 2) {
        return NextResponse.json({ error: "Banned term is too short." }, { status: 400 });
    }
    if (normalizedTerm.length > 200) {
        return NextResponse.json({ error: "Banned term is too long." }, { status: 400 });
    }

    const adminClient = createAdminClient() as any;
    const { data: existing, error: existingError } = await adminClient
        .from("message_moderation_banned_terms")
        .select("id")
        .eq("normalized_term", normalizedTerm)
        .maybeSingle();

    if (existingError) {
        return NextResponse.json({ error: "Failed to validate banned term." }, { status: 500 });
    }

    if (existing?.id) {
        return NextResponse.json({ error: "Banned term already exists." }, { status: 409 });
    }

    const { data, error } = await adminClient
        .from("message_moderation_banned_terms")
        .insert({
            term: rawTerm,
            normalized_term: normalizedTerm,
            source: reportId ? "report" : "manual",
            report_id: reportId,
            created_by: auth.user.id,
            is_active: true,
        })
        .select("id, term, normalized_term, source, report_id, is_active, created_at")
        .single();

    if (error) {
        return NextResponse.json({ error: "Failed to create banned term." }, { status: 500 });
    }

    if (reportId) {
        const reportQuery = adminClient
            .from("message_user_reports")
            .select("metadata")
            .eq("id", reportId)
            .maybeSingle();
        const { data: reportRow } = await reportQuery;
        const existingMetadata = isJsonObject(reportRow?.metadata) ? reportRow.metadata : {};

        await adminClient
            .from("message_user_reports")
            .update({
                status: "resolved",
                metadata: {
                    ...existingMetadata,
                    promotedTerm: normalizedTerm,
                    promotedBy: auth.user.id,
                    promotedAt: new Date().toISOString(),
                },
                updated_at: new Date().toISOString(),
            })
            .eq("id", reportId);
    }

    return NextResponse.json({
        term: {
            id: data.id as string,
            term: data.term as string,
            normalizedTerm: data.normalized_term as string,
            source: data.source as string,
            reportId: (data.report_id as string | null) ?? null,
            isActive: Boolean(data.is_active),
            createdAt: data.created_at as string,
        },
    });
}
