import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { buildCandidateReport, parseValCsv } from "../generate-profanity-candidates.mjs";

describe("profanity candidate generator", () => {
    it("parses val.csv reliably", () => {
        const csvPath = path.resolve(process.cwd(), "public/dataset/val.csv");
        const csvText = fs.readFileSync(csvPath, "utf8");
        const rows = parseValCsv(csvText);

        expect(rows.length).toBeGreaterThan(2000);
        expect(rows.every((row) => row.text.length > 0)).toBe(true);
        expect(rows.every((row) => row.label === "0" || row.label === "1")).toBe(true);
    });

    it("generates non-empty reviewed candidates without null terms", () => {
        const csvPath = path.resolve(process.cwd(), "public/dataset/val.csv");
        const csvText = fs.readFileSync(csvPath, "utf8");
        const rows = parseValCsv(csvText);
        const report = buildCandidateReport(rows);

        expect(report.tokenCandidates.length).toBeGreaterThan(0);
        expect(report.tokenCandidates.every((candidate) => candidate.term.trim().length > 0)).toBe(true);
        expect(report.phraseCandidates.every((candidate) => candidate.term.trim().length > 0)).toBe(true);
    });
});
