import { describe, expect, it } from "vitest";
import { CATEGORY_DEFINITIONS, DOCS_ARTICLES, MANUAL_TITLES, getArticlesForAudience } from "../docsData";

/**
 * Routes that manual shortcuts may deep-link to. Keep in sync with src/app when a
 * route is added or removed; the test fails if a shortcut points somewhere that
 * does not exist.
 */
const KNOWN_ROUTES = new Set([
  "/download",
  "/setup/technical",
  "/landlord/dashboard",
  "/landlord/docs",
  "/landlord/properties",
  "/landlord/properties/new",
  "/landlord/unit-map",
  "/landlord/tenants",
  "/landlord/applications",
  "/landlord/leases",
  "/landlord/move-out",
  "/landlord/invoices",
  "/landlord/utility-billing",
  "/landlord/utilities",
  "/landlord/analytics",
  "/landlord/community",
  "/landlord/calendar",
  "/landlord/documents",
  "/landlord/settings",
  "/landlord/flyer",
  "/landlord/messages",
  "/landlord/maintenance",
  "/tenant/dashboard",
  "/tenant/docs",
  "/tenant/profile",
  "/tenant/settings",
  "/tenant/lease",
  "/tenant/payments",
  "/tenant/maintenance",
  "/tenant/maintenance/new",
  "/tenant/utilities",
  "/tenant/community",
  "/tenant/unit-map",
  "/tenant/messages",
  "/tenant/calendar",
]);

const stripQuery = (href: string) => href.split("?")[0];

describe("manual content integrity", () => {
  const ids = DOCS_ARTICLES.map((article) => article.id);

  it("uses unique article ids", () => {
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("has at least ten topics in every manual", () => {
    (Object.keys(MANUAL_TITLES) as Array<keyof typeof MANUAL_TITLES>).forEach((audience) => {
      expect(getArticlesForAudience(audience).length).toBeGreaterThanOrEqual(10);
    });
  });

  it("only relates articles that exist", () => {
    DOCS_ARTICLES.forEach((article) => {
      article.relatedArticleIds.forEach((relatedId) => {
        expect(ids, `${article.id} relates to missing ${relatedId}`).toContain(relatedId);
      });
      expect(article.relatedArticleIds).not.toContain(article.id);
    });
  });

  it("files every article under a category of the same audience", () => {
    DOCS_ARTICLES.forEach((article) => {
      const category = CATEGORY_DEFINITIONS[article.category];
      expect(category, `${article.id} uses unknown category ${article.category}`).toBeDefined();
      expect(category.audience, `${article.id} category audience mismatch`).toBe(article.audience);
      expect(article.categoryLabel).toBe(category.label);
    });
  });

  it("links shortcuts only to routes that exist", () => {
    DOCS_ARTICLES.forEach((article) => {
      if (!article.actionShortcut) return;
      expect(KNOWN_ROUTES.has(stripQuery(article.actionShortcut.href)), `${article.id} links to ${article.actionShortcut.href}`).toBe(true);
      expect(article.actionShortcut.label.trim().length).toBeGreaterThan(0);
    });
  });

  it("keeps tenant shortcuts inside the tenant portal", () => {
    getArticlesForAudience("tenant").forEach((article) => {
      const href = article.actionShortcut?.href;
      if (!href) return;
      expect(href.startsWith("/landlord") || href.startsWith("/setup"), `${article.id} links tenants to ${href}`).toBe(false);
    });
  });

  it("writes task-oriented articles with a summary, steps, and keywords", () => {
    DOCS_ARTICLES.forEach((article) => {
      expect(article.title.trim().length, article.id).toBeGreaterThan(0);
      expect(article.title.endsWith("."), `${article.id} title ends with a period`).toBe(false);
      expect(article.summary.length, `${article.id} summary too short`).toBeGreaterThan(40);
      expect(article.keywords.length, `${article.id} needs keywords`).toBeGreaterThanOrEqual(3);
      expect(article.steps?.length ?? 0, `${article.id} needs steps`).toBeGreaterThanOrEqual(2);
      article.steps?.forEach((step) => {
        expect(step.title.trim().length).toBeGreaterThan(0);
        expect(step.description.trim().length, `${article.id}: step "${step.title}" has no description`).toBeGreaterThan(20);
      });
    });
  });

  it("gives every user-facing article a verifiable result", () => {
    DOCS_ARTICLES.filter((article) => article.audience !== "it").forEach((article) => {
      expect(article.result?.trim().length ?? 0, `${article.id} has no result`).toBeGreaterThan(0);
    });
  });

  it("does not hard-code property policies or unsupported payment methods", () => {
    const forbidden = [/quiet hours \(/i, /\b(maya|paymaya|credit card|debit card)\b/i, /within \d+ to \d+ days/i, /keep-alive cron/i];
    DOCS_ARTICLES.forEach((article) => {
      const text = JSON.stringify(article);
      forbidden.forEach((pattern) => {
        expect(pattern.test(text), `${article.id} matches ${pattern}`).toBe(false);
      });
    });
  });
});
