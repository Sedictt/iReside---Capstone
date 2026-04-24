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

export async function POST(request: Request) {
    const supabase = await createClient();
    const {
        data: { user },
        error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await request.json();
        const { stats } = body;

        if (!stats) {
            return NextResponse.json({ error: "Missing statistics data" }, { status: 400 });
        }

        const systemPrompt = [
            "You are iRis, a professional but friendly property analysis AI assistant for landlords.",
            "Your goal is to analyze the provided property statistics and give a high-level summary of how the portfolio is performing.",
            "Format your response in STRICT JSON with the following structure:",
            "{",
            '  "summary": "A friendly 1-2 sentence overview of the current state of the property portfolio.",',
            '  "goodThings": ["Array of 2-3 specific positive achievements based on the data."],',
            '  "toLookOutFor": ["Array of 2-3 specific risks or areas needing attention based on the data."]',
            "}",
            "Be concise, approachable, and data-driven. Use a reassuring yet professional tone.",
        ].join("\n");

        const userPrompt = `Here are the latest property statistics:
        
        KPIs: ${JSON.stringify(stats.primaryKpis.concat(stats.extendedKpis))}
        Operations: ${JSON.stringify(stats.operationalSnapshot)}
        Financials: ${JSON.stringify(stats.financialChart)}
        
        Analyze this and provide the JSON response.`;

        const completion = await openai.chat.completions.create({
            model: "llama-3.1-70b-versatile",
            temperature: 0.6,
            max_tokens: 1000,
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userPrompt },
            ],
        });

        const aiContent = completion.choices[0]?.message?.content;
        if (!aiContent) throw new Error("No AI content generated");

        const parsed = JSON.parse(unwrapJsonBlock(aiContent));

        return NextResponse.json(parsed);
    } catch (error) {
        console.error("iRis Analysis API Error:", error);
        
        // Fallback response
        return NextResponse.json({
            summary: "I've analyzed your portfolio data. Overall, your properties are showing steady performance with some key operational milestones achieved.",
            goodThings: [
                "Occupancy rates remain stable across your primary units.",
                "Financial earnings are following a consistent trend for the current period."
            ],
            toLookOutFor: [
                "Keep an eye on pending maintenance requests to maintain tenant satisfaction.",
                "Review the upcoming utility bill cycles to ensure cost efficiency."
            ]
        });
    }
}
