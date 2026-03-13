import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type ReportRow = {
    metric: string;
    value: string;
    change: string;
    trend: string;
};

type ExportAuditItem = {
    id: string;
    format: "csv" | "pdf";
    range: string;
    generatedAt: string;
};

type ReportRequestBody = {
    format: "csv" | "pdf";
    mode: "Simplified" | "Detailed";
    includeExpandedKpis: boolean;
    range: string;
    generatedAt?: string;
    rows: ReportRow[];
};

const escapeCsv = (value: string) => {
    if (value.includes(",") || value.includes("\"") || value.includes("\n")) {
        return `"${value.replace(/\"/g, '""')}"`;
    }
    return value;
};

const buildCsvReport = (payload: ReportRequestBody) => {
    const reportHeaderRows = [
        ["Portfolio Statistics Report"],
        ["Generated At", payload.generatedAt ?? new Date().toLocaleString()],
        ["Selected Range", payload.range],
        ["View Mode", payload.mode],
        ["Includes Expanded KPIs", payload.includeExpandedKpis ? "Yes" : "No"],
        [],
        ["Metric", "Value", "Change", "Trend Data (mapped to selected range)"],
    ];

    const metricRows = payload.rows.map((row) => [row.metric, row.value, row.change, row.trend]);

    return [...reportHeaderRows, ...metricRows]
        .map((row) => row.map((cell) => escapeCsv(String(cell ?? ""))).join(","))
        .join("\n");
};

export async function GET() {
    const supabase = await createClient();
    const {
        data: { user },
        error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data, error } = await supabase
        .from("landlord_statistics_exports")
        .select("id, format, report_range, created_at")
        .eq("landlord_id", user.id)
        .order("created_at", { ascending: false })
        .limit(20);

    if (error) {
        return NextResponse.json({ error: "Failed to fetch export history." }, { status: 500 });
    }

    const history: ExportAuditItem[] = (data ?? []).map((row) => ({
        id: row.id,
        format: row.format,
        range: row.report_range,
        generatedAt: row.created_at,
    }));

    return NextResponse.json({ history });
}

export async function POST(request: Request) {
    const supabase = await createClient();
    const {
        data: { user },
        error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json()) as Partial<ReportRequestBody>;

    if (!body.format || !body.mode || !body.range || !Array.isArray(body.rows)) {
        return NextResponse.json({ error: "Invalid report payload." }, { status: 400 });
    }

    const payload: ReportRequestBody = {
        format: body.format,
        mode: body.mode,
        includeExpandedKpis: Boolean(body.includeExpandedKpis),
        range: body.range,
        generatedAt: body.generatedAt,
        rows: body.rows,
    };

    const { error: insertError } = await supabase.from("landlord_statistics_exports").insert({
        landlord_id: user.id,
        format: payload.format,
        report_range: payload.range,
        mode: payload.mode,
        include_expanded_kpis: payload.includeExpandedKpis,
        row_count: payload.rows.length,
        metadata: {
            generatedAt: payload.generatedAt ?? new Date().toLocaleString(),
        },
    });

    if (insertError) {
        return NextResponse.json({ error: "Failed to record export history." }, { status: 500 });
    }

    if (payload.format === "pdf") {
        return NextResponse.json({ success: true });
    }

    const csvReport = buildCsvReport(payload);

    return new NextResponse(csvReport, {
        status: 200,
        headers: {
            "Content-Type": "text/csv; charset=utf-8",
            "Cache-Control": "no-store",
        },
    });
}
