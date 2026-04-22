#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const WORD_PATTERN = /[\p{L}\p{N}][\p{L}\p{N}'-]*/gu;
const TOKEN_MIN_LENGTH = 3;

const normalizeTerm = (value) => value.normalize("NFKC").toLowerCase().replace(/\s+/g, " ").trim();

const tokenize = (text) =>
    (text.match(WORD_PATTERN) ?? []).map(normalizeTerm).filter((token) => token.length >= TOKEN_MIN_LENGTH);

const parseCsvLine = (line) => {
    const fields = [];
    let current = "";
    let inQuotes = false;

    for (let index = 0; index < line.length; index += 1) {
        const char = line[index];

        if (char === "\"") {
            const next = line[index + 1];
            if (inQuotes && next === "\"") {
                current += "\"";
                index += 1;
                continue;
            }

            inQuotes = !inQuotes;
            continue;
        }

        if (char === "," && !inQuotes) {
            fields.push(current);
            current = "";
            continue;
        }

        current += char;
    }

    fields.push(current);
    return fields;
};

export const parseSpamCsv = (csvText) => {
    const lines = csvText.replace(/\r\n/g, "\n").split("\n").filter((line) => line.trim().length > 0);
    if (lines.length < 2) {
        return [];
    }

    const headerFields = parseCsvLine(lines[0]).map((value) => value.trim().toLowerCase());
    if (headerFields[0] !== "v1" || headerFields[1] !== "v2") {
        throw new Error("Unsupported CSV header. Expected first columns: v1,v2");
    }

    return lines.slice(1).map((line, index) => {
        const fields = parseCsvLine(line);
        const label = (fields[0] ?? "").trim().toLowerCase();
        const text = (fields[1] ?? "").trim();

        if (!text || (label !== "spam" && label !== "ham")) {
            throw new Error(`Invalid row values at line ${index + 2}.`);
        }

        return { label, text };
    });
};

const collectCounts = (rows, buildUnits) => {
    const positive = new Map();
    const negative = new Map();

    for (const row of rows) {
        const units = new Set(buildUnits(row.text));
        const target = row.label === "spam" ? positive : negative;

        for (const unit of units) {
            target.set(unit, (target.get(unit) ?? 0) + 1);
        }
    }

    return { positive, negative };
};

const rankCandidates = (positive, negative, minPositive, minRatio) => {
    const ranked = [];

    for (const [unit, positiveCount] of positive.entries()) {
        const negativeCount = negative.get(unit) ?? 0;
        const ratio = (positiveCount + 1) / (negativeCount + 1);
        if (positiveCount < minPositive || ratio < minRatio) {
            continue;
        }

        ranked.push({
            term: unit,
            spamCount: positiveCount,
            hamCount: negativeCount,
            confidence: Number(ratio.toFixed(2)),
        });
    }

    return ranked.sort((a, b) => b.confidence - a.confidence || b.spamCount - a.spamCount || a.term.localeCompare(b.term));
};

const buildPhraseUnits = (text) => {
    const tokens = tokenize(text);
    const phrases = [];
    for (let index = 0; index < tokens.length - 1; index += 1) {
        phrases.push(`${tokens[index]} ${tokens[index + 1]}`);
    }
    return phrases;
};

export const buildSpamCandidateReport = (rows) => {
    const tokenCounts = collectCounts(rows, tokenize);
    const phraseCounts = collectCounts(rows, buildPhraseUnits);
    const spamRows = rows.filter((row) => row.label === "spam").length;
    const hamRows = rows.filter((row) => row.label === "ham").length;

    return {
        generatedAt: new Date().toISOString(),
        totalRows: rows.length,
        labelCounts: {
            ham: hamRows,
            spam: spamRows,
        },
        tokenCandidates: rankCandidates(tokenCounts.positive, tokenCounts.negative, 10, 2.0),
        phraseCandidates: rankCandidates(phraseCounts.positive, phraseCounts.negative, 4, 2.5),
    };
};

const main = () => {
    const inputPath = process.argv[2] ?? "public/dataset/spam.csv";
    const outputPath = process.argv[3] ?? "output/spam-candidates.json";

    const csvText = fs.readFileSync(inputPath, "utf8");
    const rows = parseSpamCsv(csvText);
    const report = buildSpamCandidateReport(rows);

    const absoluteOutputPath = path.resolve(outputPath);
    fs.mkdirSync(path.dirname(absoluteOutputPath), { recursive: true });
    fs.writeFileSync(absoluteOutputPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");

    console.log(
        [
            `Input: ${path.resolve(inputPath)}`,
            `Rows: ${rows.length}`,
            `Token candidates: ${report.tokenCandidates.length}`,
            `Phrase candidates: ${report.phraseCandidates.length}`,
            `Output: ${absoluteOutputPath}`,
        ].join("\n")
    );
};

const currentFilePath = fileURLToPath(import.meta.url);
if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(currentFilePath)) {
    main();
}
