import { createHash } from "node:crypto";
import type { MaintenancePriority } from "@/types/database";

export type MaintenanceSentiment = "distressed" | "negative" | "neutral" | "positive";

export type MaintenanceTriageInput = {
    id: string;
    title: string;
    description: string;
    category: string | null;
    selfRepairRequested: boolean;
    imageCount: number;
};

export type MaintenanceTriageResult = {
    priority: MaintenancePriority;
    sentiment: MaintenanceSentiment;
    reason: string;
    confidence: number;
    source: "ai" | "heuristic" | "cache";
};

type ParsedBatchResult = {
    id: string;
    priority: string;
    sentiment: string;
    reason: string;
    confidence: number;
};

const URGENT_KEYWORDS = [
    "fire",
    "smoke",
    "gas leak",
    "electrical spark",
    "electrical burning",
    "burst pipe",
    "flood",
    "flooding",
    "no power",
    "power outage",
    "security breach",
    "break in",
];

const HIGH_KEYWORDS = [
    "leak",
    "water damage",
    "mold",
    "toilet",
    "sewage",
    "aircon",
    "aircon not working",
    "lock",
    "door broken",
    "window broken",
    "no water",
];

const DISTRESSED_KEYWORDS = ["urgent", "asap", "immediately", "emergency", "please help", "panic", "terrified"];
const NEGATIVE_KEYWORDS = ["frustrated", "angry", "upset", "annoyed", "worse", "bad", "unacceptable", "not fixed"];
const POSITIVE_KEYWORDS = ["thank you", "thanks", "resolved", "okay now", "all good"];

const normalizePriority = (value: string): MaintenancePriority | null => {
    const normalized = value.trim().toLowerCase();
    if (normalized === "urgent") return "urgent";
    if (normalized === "high") return "high";
    if (normalized === "medium") return "medium";
    if (normalized === "low") return "low";
    return null;
};

const normalizeSentiment = (value: string): MaintenanceSentiment | null => {
    const normalized = value.trim().toLowerCase();
    if (normalized === "distressed") return "distressed";
    if (normalized === "negative") return "negative";
    if (normalized === "neutral") return "neutral";
    if (normalized === "positive") return "positive";
    return null;
};

const clampConfidence = (value: unknown) => {
    const numeric = typeof value === "number" ? value : Number(value);
    if (Number.isNaN(numeric)) return 0.5;
    return Math.max(0, Math.min(1, numeric));
};

const unwrapJsonBlock = (text: string) => {
    const trimmed = text.trim();
    if (trimmed.startsWith("```") && trimmed.endsWith("```")) {
        return trimmed.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
    }
    return trimmed;
};

export const computeMaintenanceTriageHash = (input: MaintenanceTriageInput) => {
    const normalized = {
        title: input.title.trim().toLowerCase(),
        description: input.description.trim().toLowerCase(),
        category: input.category?.trim().toLowerCase() ?? "",
        selfRepairRequested: input.selfRepairRequested,
        imageCount: input.imageCount,
    };

    return createHash("sha256").update(JSON.stringify(normalized)).digest("hex");
};

export const buildHeuristicMaintenanceTriage = (input: MaintenanceTriageInput): MaintenanceTriageResult => {
    const text = `${input.title} ${input.description}`.toLowerCase();

    let priority: MaintenancePriority = "low";
    let sentiment: MaintenanceSentiment = "neutral";
    let reason = "General maintenance concern with no immediate hazard identified.";
    let confidence = 0.62;

    if (URGENT_KEYWORDS.some((keyword) => text.includes(keyword))) {
        priority = "urgent";
        confidence = 0.9;
        reason = "Contains indicators of immediate safety or major property risk.";
    } else if (HIGH_KEYWORDS.some((keyword) => text.includes(keyword))) {
        priority = "high";
        confidence = 0.82;
        reason = "Likely to worsen quickly or significantly affect livability.";
    } else if (input.selfRepairRequested) {
        priority = "medium";
        confidence = 0.73;
        reason = "Requires prompt review due to requested tenant-led repair workflow.";
    } else if (input.imageCount > 0) {
        priority = "medium";
        confidence = 0.7;
        reason = "Issue includes photo evidence and should be assessed in normal priority queue.";
    }

    if (DISTRESSED_KEYWORDS.some((keyword) => text.includes(keyword))) {
        sentiment = "distressed";
    } else if (NEGATIVE_KEYWORDS.some((keyword) => text.includes(keyword))) {
        sentiment = "negative";
    } else if (POSITIVE_KEYWORDS.some((keyword) => text.includes(keyword))) {
        sentiment = "positive";
    }

    return { priority, sentiment, reason, confidence, source: "heuristic" };
};

export const parseMaintenanceTriageBatch = (raw: string): Map<string, MaintenanceTriageResult> => {
    const parsedMap = new Map<string, MaintenanceTriageResult>();

    try {
        const parsed = JSON.parse(unwrapJsonBlock(raw)) as unknown;
        if (!Array.isArray(parsed)) {
            return parsedMap;
        }

        parsed.forEach((entry) => {
            if (!entry || typeof entry !== "object") return;

            const candidate = entry as Partial<ParsedBatchResult>;
            const id = typeof candidate.id === "string" ? candidate.id.trim() : "";
            const priority = typeof candidate.priority === "string" ? normalizePriority(candidate.priority) : null;
            const sentiment = typeof candidate.sentiment === "string" ? normalizeSentiment(candidate.sentiment) : null;
            const reason = typeof candidate.reason === "string" ? candidate.reason.trim() : "";

            if (!id || !priority || !sentiment || !reason) return;

            parsedMap.set(id, {
                priority,
                sentiment,
                reason,
                confidence: clampConfidence(candidate.confidence),
                source: "ai",
            });
        });
    } catch {
        return parsedMap;
    }

    return parsedMap;
};

