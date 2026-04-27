import { NextResponse } from "next/server";
import OpenAI from "openai";
import { createClient } from "@/lib/supabase/server";

type InsightSource = "ai" | "fallback";

type KpiInsight = {
    summary: string;
    status: string;
    recommendation: string;
    source?: InsightSource;
};

type KpiInput = {
    title: string;
    value: string;
    change: string;
    trendData: number[];
    changeType: "positive" | "negative" | "neutral";
};

type InsightRequestBody = {
    rangeStart: string;
    rangeEnd: string;
    kpis: KpiInput[];
};

const openai = new OpenAI({
    apiKey: process.env.GROQ_API_KEY,
    baseURL: "https://api.groq.com/openai/v1",
});

const buildFallbackInsight = (kpi: KpiInput): KpiInsight => {
    const trend =
        kpi.changeType === "positive"
            ? "This metric is moving in a healthy direction."
            : kpi.changeType === "negative"
              ? "This metric needs closer monitoring."
              : "This metric is currently stable.";

    const action =
        kpi.changeType === "positive"
            ? "Keep the current strategy, and track what actions are driving this result so you can repeat them."
            : kpi.changeType === "negative"
              ? "Review recent tenant feedback, maintenance timing, and pricing decisions to identify the main cause this week."
              : "Set a weekly checkpoint to confirm this metric stays stable and does not drift in the wrong direction.";

    return {
        summary: `${kpi.title} is currently ${kpi.value} with a recent movement of ${kpi.change}.`,
        status: trend,
        recommendation: action,
        source: "fallback",
    };
};

const unwrapJsonBlock = (text: string) => {
    const trimmed = text.trim();
    if (trimmed.startsWith("```") && trimmed.endsWith("```")) {
        return trimmed.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
    }
    return trimmed;
};

const parseInsights = (raw: string): Record<string, KpiInsight> | null => {
    try {
        const parsed = JSON.parse(unwrapJsonBlock(raw)) as unknown;
        if (!parsed || typeof parsed !== "object") {
            return null;
        }

        const result: Record<string, KpiInsight> = {};
        Object.entries(parsed as Record<string, unknown>).forEach(([key, value]) => {
            if (!value || typeof value !== "object") return;

            const candidate = value as Record<string, unknown>;
            const summary = typeof candidate.summary === "string" ? candidate.summary.trim() : "";
            const status = typeof candidate.status === "string" ? candidate.status.trim() : "";
            const recommendation = typeof candidate.recommendation === "string" ? candidate.recommendation.trim() : "";

            if (summary && status && recommendation) {
                result[key] = {
                    summary,
                    status,
                    recommendation,
                    source: "ai",
                };
            }
        });

        return Object.keys(result).length > 0 ? result : null;
    } catch {
        return null;
    }
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

    const body = (await request.json()) as Partial<InsightRequestBody>;
    if (!body.rangeStart || !body.rangeEnd || !Array.isArray(body.kpis) || body.kpis.length === 0) {
        return NextResponse.json({ error: "Invalid insights payload." }, { status: 400 });
    }

    const kpis = body.kpis.filter(
        (kpi): kpi is KpiInput =>
            Boolean(kpi) &&
            typeof kpi.title === "string" &&
            typeof kpi.value === "string" &&
            typeof kpi.change === "string" &&
            Array.isArray(kpi.trendData) &&
            (kpi.changeType === "positive" || kpi.changeType === "negative" || kpi.changeType === "neutral")
    );

    if (kpis.length === 0) {
        return NextResponse.json({ error: "No valid KPI records found." }, { status: 400 });
    }

    const fallbackInsights = Object.fromEntries(kpis.map((kpi) => [kpi.title, buildFallbackInsight(kpi)]));

    if (!process.env.GROQ_API_KEY) {
        return NextResponse.json({ insights: fallbackInsights, source: "fallback" as const });
    }

    try {
        const systemPrompt = [
            "You are iRis, an analytics assistant for landlords.",
            "Explain KPIs in plain language for non-technical users.",
            "Use short, direct, friendly wording.",
            "Avoid jargon and avoid legal/financial guarantees.",
            "Respond ONLY in strict JSON.",
            "Output shape:",
            "{",
            '  "<exact KPI title>": {',
            '    "summary": "one to two sentences explaining what the metric means now",',
            '    "status": "one sentence about whether this is good/neutral/risky",',
            '    "recommendation": "one concrete next action the landlord can take"',
            "  }",
            "}",
        ].join("\n");

        const completion = await openai.chat.completions.create({
            model: "llama-3.1-8b-instant",
            temperature: 0.4,
            max_tokens: 900,
            messages: [
                { role: "system", content: systemPrompt },
                {
                    role: "user",
                    content: JSON.stringify({
                        dateRange: { start: body.rangeStart, end: body.rangeEnd },
                        kpis,
                    }),
                },
            ],
        });

        const aiContent = completion.choices[0]?.message?.content;
        const parsed = aiContent ? parseInsights(aiContent) : null;

        if (!parsed) {
            return NextResponse.json({ insights: fallbackInsights, source: "fallback" as const });
        }

        const mergedInsights: Record<string, KpiInsight> = { ...fallbackInsights };
        kpis.forEach((kpi) => {
            if (parsed[kpi.title]) {
                mergedInsights[kpi.title] = parsed[kpi.title];
            }
        });

        return NextResponse.json({ insights: mergedInsights, source: "ai" as const });
    } catch (error) {
        console.error("Error generating landlord KPI insights:", error);
        return NextResponse.json({ insights: fallbackInsights, source: "fallback" as const });
    }
}
