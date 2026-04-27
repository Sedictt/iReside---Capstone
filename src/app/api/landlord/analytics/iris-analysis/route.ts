import { NextResponse } from "next/server";
import OpenAI from "openai";
import { createClient } from "@/lib/supabase/server";

const openai = new OpenAI({
    apiKey: process.env.GROQ_API_KEY,
    baseURL: "https://api.groq.com/openai/v1",
});

const unwrapJsonBlock = (text: string) => {
    const trimmed = text.trim();
    if (trimmed.startsWith("```") && trimmed.endsWith("```")) {
        return trimmed.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
    }
    return trimmed;
};

type IrisAnalysisResponse = {
    summary: string;
    goodThings: string[];
    toLookOutFor: string[];
};

const parseCurrency = (value: unknown) => {
    if (typeof value !== "string") return 0;
    const normalized = value.replace(/[^0-9.-]/g, "");
    const parsed = Number.parseFloat(normalized);
    return Number.isFinite(parsed) ? parsed : 0;
};

const parsePercent = (value: unknown) => {
    if (typeof value !== "string") return 0;
    const normalized = value.replace(/[^0-9.-]/g, "");
    const parsed = Number.parseFloat(normalized);
    return Number.isFinite(parsed) ? parsed : 0;
};

const parseCount = (value: unknown) => {
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (typeof value !== "string") return 0;
    const normalized = value.replace(/[^0-9.-]/g, "");
    const parsed = Number.parseFloat(normalized);
    return Number.isFinite(parsed) ? parsed : 0;
};

const extractFirstJsonObject = (text: string) => {
    const cleaned = unwrapJsonBlock(text);
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    if (start < 0 || end < start) return cleaned;
    return cleaned.slice(start, end + 1);
};

const coerceAnalysis = (input: unknown): IrisAnalysisResponse | null => {
    if (!input || typeof input !== "object") return null;
    const candidate = input as Partial<IrisAnalysisResponse>;

    if (typeof candidate.summary !== "string") return null;
    const goodThings = Array.isArray(candidate.goodThings)
        ? candidate.goodThings.filter((item): item is string => typeof item === "string" && item.trim().length > 0)
        : [];
    const toLookOutFor = Array.isArray(candidate.toLookOutFor)
        ? candidate.toLookOutFor.filter((item): item is string => typeof item === "string" && item.trim().length > 0)
        : [];

    if (goodThings.length === 0 || toLookOutFor.length === 0) {
        return null;
    }

    return {
        summary: candidate.summary.trim(),
        goodThings: goodThings.slice(0, 3),
        toLookOutFor: toLookOutFor.slice(0, 3),
    };
};

const buildStatsAwareFallback = (stats: unknown): IrisAnalysisResponse => {
    const safeStats = (stats && typeof stats === "object" ? stats : {}) as {
        primaryKpis?: Array<{ title?: string; value?: string }>;
        extendedKpis?: Array<{ title?: string; value?: string }>;
        financialChart?: {
            month?: {
                earnings?: unknown[];
            };
        };
    };
    const primary = Array.isArray(safeStats.primaryKpis) ? safeStats.primaryKpis : [];
    const extended = Array.isArray(safeStats.extendedKpis) ? safeStats.extendedKpis : [];
    const combined = [...primary, ...extended];

    const earningsKpi = combined.find((kpi) => typeof kpi?.title === "string" && kpi.title.toLowerCase().includes("earning"));
    const occupancyKpi = combined.find((kpi) => typeof kpi?.title === "string" && kpi.title.toLowerCase().includes("occupancy"));
    const tenantsKpi = combined.find((kpi) => typeof kpi?.title === "string" && kpi.title.toLowerCase().includes("tenant"));
    const pendingKpi = combined.find((kpi) => typeof kpi?.title === "string" && kpi.title.toLowerCase().includes("pending"));
    const maintenanceKpi = combined.find((kpi) => typeof kpi?.title === "string" && kpi.title.toLowerCase().includes("maintenance"));

    const earnings = parseCurrency(earningsKpi?.value);
    const occupancyPct = parsePercent(occupancyKpi?.value);
    const activeTenants = parseCount(tenantsKpi?.value);
    const pendingIssues = parseCount(pendingKpi?.value);
    const maintenanceCost = parseCurrency(maintenanceKpi?.value);

    const monthEarnings = Array.isArray(safeStats.financialChart?.month?.earnings)
        ? safeStats.financialChart.month.earnings.reduce((sum: number, current: unknown) => sum + (typeof current === "number" ? current : 0), 0)
        : 0;

    const summary = `Portfolio snapshot: ${activeTenants} active tenants, ${Math.round(occupancyPct)}% occupancy, and ₱${Math.round(
        earnings
    ).toLocaleString()} current earnings. Monthly earnings trend is around ₱${Math.round(monthEarnings).toLocaleString()}.`;

    const goodThings = [
        occupancyPct >= 85
            ? `Occupancy is healthy at ${Math.round(occupancyPct)}%, supporting stable cash flow.`
            : `You still have ${Math.round(occupancyPct)}% occupancy, with room to improve fill rate.`,
        earnings > 0
            ? `Current earnings are ₱${Math.round(earnings).toLocaleString()}, which gives a strong operating baseline.`
            : "Income activity is currently low, so this period is a good window to tighten collections.",
        monthEarnings > 0
            ? `Monthly earnings data is populated, giving you enough signal for trend tracking.`
            : "Financial trend data is present but still light this month.",
    ];

    const toLookOutFor = [
        pendingIssues > 0
            ? `${pendingIssues} pending issue(s) may pressure tenant satisfaction if left unresolved.`
            : "Pending issues are low now; keep response times fast to stay ahead.",
        maintenanceCost > 0
            ? `Maintenance spend is at ₱${Math.round(maintenanceCost).toLocaleString()}; review if costs are preventive or reactive.`
            : "Maintenance cost is currently low; continue preventive checks to avoid sudden spikes.",
        occupancyPct < 90
            ? "There is still vacancy upside; improving inquiry-to-lease conversion can lift revenue."
            : "With high occupancy, focus on retention and renewal quality to protect performance.",
    ];

    return { summary, goodThings, toLookOutFor };
};

export async function POST(request: Request) {
    const supabase = await createClient();
    const {
        data: { user },
        error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let statsPayload: unknown = null;

    try {
        const body = await request.json();
        const { stats } = body;
        statsPayload = stats;

        if (!stats) {
            return NextResponse.json({ error: "Missing analytics data" }, { status: 400 });
        }

        const systemPrompt = [
            "You are iRis, a professional but friendly property analysis AI assistant for landlords.",
            "Your goal is to analyze the provided property analytics and give a high-level summary of how the portfolio is performing.",
            "Format your response in STRICT JSON with the following structure:",
            "{",
            '  "summary": "A friendly 1-2 sentence overview of the current state of the property portfolio.",',
            '  "goodThings": ["Array of 2-3 specific positive achievements based on the data."],',
            '  "toLookOutFor": ["Array of 2-3 specific risks or areas needing attention based on the data."]',
            "}",
            "Be concise, approachable, and data-driven. Use a reassuring yet professional tone.",
        ].join("\n");

        const userPrompt = `Here are the latest property analytics:
        
        KPIs: ${JSON.stringify(stats.primaryKpis.concat(stats.extendedKpis))}
        Operations: ${JSON.stringify(stats.operationalSnapshot)}
        Financials: ${JSON.stringify(stats.financialChart)}
        
        Analyze this and provide the JSON response.`;

        const completion = await openai.chat.completions.create({
            model: "llama-3.1-70b-versatile",
            temperature: 0.6,
            max_tokens: 1000,
            response_format: { type: "json_object" },
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userPrompt },
            ],
        });

        const aiContent = completion.choices[0]?.message?.content;
        if (!aiContent) throw new Error("No AI content generated");

        const parsed = JSON.parse(extractFirstJsonObject(aiContent));
        const safeParsed = coerceAnalysis(parsed);
        if (!safeParsed) {
            throw new Error("AI response missing required analysis fields");
        }

        return NextResponse.json(safeParsed);
    } catch (error) {
        console.error("iRis Analysis API Error:", error);
        return NextResponse.json(buildStatsAwareFallback(statsPayload));
    }
}
