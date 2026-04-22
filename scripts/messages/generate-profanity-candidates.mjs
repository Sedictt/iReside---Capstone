#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const WORD_PATTERN = /[\p{L}\p{N}][\p{L}\p{N}'-]*/gu;
const TOKEN_MIN_LENGTH = 3;

const normalizeTerm = (value) => value.normalize("NFKC").toLowerCase().replace(/\s+/g, " ").trim();

const tokenize = (text) =>
    (text.match(WORD_PATTERN) ?? []).map(normalizeTerm).filter((token) => token.length >= TOKEN_MIN_LENGTH);

export const parseValCsv = (csvText) => {
    const lines = csvText.replace(/\r\n/g, "\n").split("\n").filter((line) => line.trim().length > 0);
    if (lines.length < 2) {
        return [];
    }

    const header = lines[0].trim().toLowerCase();
    if (header !== "text,label") {
        throw new Error("Unsupported CSV header. Expected: text,label");
    }

    return lines.slice(1).map((line, index) => {
        const separatorIndex = line.lastIndexOf(",");
        if (separatorIndex <= 0 || separatorIndex === line.length - 1) {
            throw new Error(`Malformed CSV row at line ${index + 2}.`);
        }

        const text = line.slice(0, separatorIndex).trim();
        const label = line.slice(separatorIndex + 1).trim();

        if (!text || (label !== "0" && label !== "1")) {
            throw new Error(`Invalid row values at line ${index + 2}.`);
        }

        return { text, label };
    });
};

const collectCounts = (rows, buildUnits) => {
    const positive = new Map();
    const negative = new Map();

    for (const row of rows) {
        const units = new Set(buildUnits(row.text));
        const target = row.label === "1" ? positive : negative;

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
            positiveCount,
            negativeCount,
            confidence: Number(ratio.toFixed(2)),
        });
    }

    return ranked.sort((a, b) => b.confidence - a.confidence || b.positiveCount - a.positiveCount || a.term.localeCompare(b.term));
};

const buildPhraseUnits = (text) => {
    const tokens = tokenize(text);
    const phrases = [];
    for (let index = 0; index < tokens.length - 1; index += 1) {
        phrases.push(`${tokens[index]} ${tokens[index + 1]}`);
    }
    return phrases;
};

export const buildCandidateReport = (rows) => {
    const tokenCounts = collectCounts(rows, tokenize);
    const phraseCounts = collectCounts(rows, buildPhraseUnits);

    const tokenCandidates = rankCandidates(tokenCounts.positive, tokenCounts.negative, 6, 1.8);
    const phraseCandidates = rankCandidates(phraseCounts.positive, phraseCounts.negative, 3, 2.5);

    return {
        generatedAt: new Date().toISOString(),
        totalRows: rows.length,
        labelCounts: {
            clean: rows.filter((row) => row.label === "0").length,
            offensive: rows.filter((row) => row.label === "1").length,
        },
        tokenCandidates,
        phraseCandidates,
    };
};

const main = () => {
    const inputPath = process.argv[2] ?? "public/dataset/val.csv";
    const outputPath = process.argv[3] ?? "output/profanity-candidates.json";

    const csvText = fs.readFileSync(inputPath, "utf8");
    const rows = parseValCsv(csvText);
    const report = buildCandidateReport(rows);

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
