import { NextResponse } from "next/server";
import { requireAuthenticatedUser } from "@/lib/api/auth-guard";
import { DEFAULT_PROPERTY_RULES, normalizeRuleText, isRuleDuplicate } from "@/lib/constants/rules";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
    const authContext = await requireAuthenticatedUser(request);
    if (!("userId" in authContext)) return authContext as Response;
    const { userId, supabase } = authContext;

    try {
        // Gather all house rules ever used in landlord's properties
        const { data: propertiesData, error: propError } = await (supabase as any)
            .from("properties")
            .select("house_rules")
            .eq("landlord_id", userId);

        if (propError) {
            console.error("[GET /api/landlord/rules/custom] Error fetching properties:", propError);
        }

        const customRulesSet: string[] = [];

        const addCandidate = (raw: string | null | undefined) => {
            if (!raw || typeof raw !== "string") return;
            const normalized = normalizeRuleText(raw);
            if (
                normalized &&
                !isRuleDuplicate(normalized, DEFAULT_PROPERTY_RULES) &&
                !isRuleDuplicate(normalized, customRulesSet)
            ) {
                customRulesSet.push(normalized);
            }
        };

        if (Array.isArray(propertiesData)) {
            for (const prop of propertiesData) {
                if (Array.isArray(prop.house_rules)) {
                    for (const item of prop.house_rules) {
                        addCandidate(typeof item === "string" ? item : (item as any)?.title || (item as any)?.name);
                    }
                }
            }
        }

        return NextResponse.json(
            { customRules: customRulesSet },
            { headers: { "Cache-Control": "no-store, no-cache, must-revalidate" } }
        );
    } catch (error) {
        console.error("[GET /api/landlord/rules/custom] Unexpected error:", error);
        return NextResponse.json(
            { error: "Failed to fetch custom rules", customRules: [] },
            { status: 500 }
        );
    }
}
