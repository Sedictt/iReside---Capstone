import { DocArticle, DOCS_ARTICLES, DocAudience, DocCategory } from "./docsData";

// Known dictionary terms for fuzzy "Did You Mean?" corrections
export const COMMON_DOC_TERMS: string[] = [
  "gcash",
  "qr code",
  "billing",
  "invoice",
  "invoicing",
  "tenant",
  "resident",
  "landlord",
  "lease",
  "signing",
  "signature",
  "poster",
  "flyer",
  "wifi",
  "maintenance",
  "repairs",
  "ticket",
  "install",
  "mobile",
  "iphone",
  "android",
  "pwa",
  "email",
  "smtp",
  "notifications",
  "password",
  "supabase",
  "database",
  "postgres",
  "schema",
  "rls",
  "security",
  "cron",
  "keep-alive",
  "backup",
  "recovery",
  "handover",
  "utilities",
  "submeter",
  "partial payments",
  "move out",
  "deposit",
];

// Levenshtein Distance for typo matching
export function getLevenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          Math.min(
            matrix[i][j - 1] + 1, // insertion
            matrix[i - 1][j] + 1 // deletion
          )
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

// Find fuzzy suggestion for typos
export function findFuzzySuggestion(query: string): string | null {
  const cleanQuery = query.toLowerCase().trim();
  if (cleanQuery.length < 3) return null;

  // If query is already an exact match in dictionary, no correction needed
  if (COMMON_DOC_TERMS.includes(cleanQuery)) return null;

  let bestMatch: string | null = null;
  let minDistance = 3; // Max allowable typo distance is 2

  for (const term of COMMON_DOC_TERMS) {
    const dist = getLevenshteinDistance(cleanQuery, term.toLowerCase());
    if (dist > 0 && dist < minDistance) {
      minDistance = dist;
      bestMatch = term;
    }
  }

  return bestMatch;
}

export interface SearchResult {
  article: DocArticle;
  score: number;
  matchType: "exact_title" | "keyword" | "partial_content";
}

export interface SearchResponse {
  results: DocArticle[];
  didYouMean: string | null;
  query: string;
  totalCount: number;
}

export function searchDocs(
  query: string,
  options?: {
    audience?: DocAudience;
    category?: DocCategory | "all";
  }
): SearchResponse {
  const cleanQuery = query.toLowerCase().trim();
  const rawAudience = options?.audience;
  const targetAudience = rawAudience === "user" ? "landlord" : rawAudience;
  const category = options?.category && options.category !== "all" ? options.category : null;

  // Filter pool by audience and category
  let pool = DOCS_ARTICLES;
  if (targetAudience) {
    pool = pool.filter((a) => a.audience === targetAudience);
  }
  if (category) {
    pool = pool.filter((a) => a.category === category);
  }

  if (!cleanQuery) {
    return {
      results: pool,
      didYouMean: null,
      query,
      totalCount: pool.length,
    };
  }

  const scoredResults: SearchResult[] = [];
  const queryTokens = cleanQuery.split(/\s+/).filter(Boolean);

  for (const article of pool) {
    let score = 0;
    let matchType: SearchResult["matchType"] = "partial_content";

    const titleLower = article.title.toLowerCase();
    const summaryLower = article.summary.toLowerCase();
    const keywordsLower = article.keywords.map((k) => k.toLowerCase());
    const categoryLabelLower = article.categoryLabel.toLowerCase();

    // 1. Exact Title Match
    if (titleLower.includes(cleanQuery)) {
      score += 100;
      matchType = "exact_title";
    }

    // 2. Keyword Matches
    for (const kw of keywordsLower) {
      if (kw === cleanQuery) {
        score += 80;
        matchType = "keyword";
      } else if (kw.includes(cleanQuery) || cleanQuery.includes(kw)) {
        score += 50;
      }
    }

    // 3. Token Match in Title, Summary, and Category
    for (const token of queryTokens) {
      if (titleLower.includes(token)) score += 30;
      if (summaryLower.includes(token)) score += 20;
      if (categoryLabelLower.includes(token)) score += 15;
      for (const kw of keywordsLower) {
        if (kw.includes(token)) score += 25;
      }
      // Check in steps
      if (article.steps) {
        for (const s of article.steps) {
          if (s.title.toLowerCase().includes(token)) score += 15;
          if (s.description.toLowerCase().includes(token)) score += 10;
        }
      }
    }

    if (score > 0) {
      scoredResults.push({ article, score, matchType });
    }
  }

  // Sort descending by score
  scoredResults.sort((a, b) => b.score - a.score);

  const results = scoredResults.map((sr) => sr.article);

  // If no or few results, calculate "Did You Mean?" suggestion
  let didYouMean: string | null = null;
  if (results.length <= 1) {
    didYouMean = findFuzzySuggestion(cleanQuery);
  }

  return {
    results,
    didYouMean,
    query,
    totalCount: results.length,
  };
}
