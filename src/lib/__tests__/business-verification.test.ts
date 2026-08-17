import { describe, expect, it, vi, beforeEach } from "vitest";
import {
  searchValenzuelaBusinessDatabank,
  generateValenzuelaSearchURL,
} from "@/lib/business-verification";
import * as scraperModule from "@/lib/valenzuela-scraper";

vi.mock("@/lib/valenzuela-scraper", () => ({
  scrapeValenzuelaBusinessDatabank: vi.fn(),
}));

describe("business-verification", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("searchValenzuelaBusinessDatabank", () => {
    it("returns 'found' status when matching business rows exist", async () => {
      const mockRows = [
        {
          businessName: "Acme Rentals Inc.",
          ownerName: "John Doe",
          address: "123 MacArthur Hwy, Valenzuela",
          lineOfBusiness: "Real Estate Lessor",
          plateNo: "VR-2026-001",
          status: "Registered",
        },
      ];

      vi.mocked(scraperModule.scrapeValenzuelaBusinessDatabank).mockResolvedValue({
        rows: mockRows as any,
      });

      const result = await searchValenzuelaBusinessDatabank("Acme Rentals");

      expect(result.status).toBe("found");
      expect(result.rows).toEqual(mockRows);
      expect(result.source).toBe("valenzuela_business_databank");
      expect(result.checkedAt).toBeDefined();
      expect(result.error).toBeUndefined();
    });

    it("returns 'not_found' status when scraper returns zero rows", async () => {
      vi.mocked(scraperModule.scrapeValenzuelaBusinessDatabank).mockResolvedValue({
        rows: [],
      });

      const result = await searchValenzuelaBusinessDatabank("Nonexistent Corp");

      expect(result.status).toBe("not_found");
      expect(result.rows).toEqual([]);
      expect(result.error).toContain("No businesses found");
      expect(result.source).toBe("valenzuela_business_databank");
      expect(result.checkedAt).toBeDefined();
    });

    it("returns 'error' status with custom message when scraper throws an Error", async () => {
      vi.mocked(scraperModule.scrapeValenzuelaBusinessDatabank).mockRejectedValue(
        new Error("Connection timeout to government portal"),
      );

      const result = await searchValenzuelaBusinessDatabank("Acme Rentals");

      expect(result.status).toBe("error");
      expect(result.rows).toEqual([]);
      expect(result.error).toBe("Connection timeout to government portal");
      expect(result.source).toBe("valenzuela_business_databank");
      expect(result.checkedAt).toBeDefined();
    });

    it("returns fallback error message when scraper throws a non-Error object", async () => {
      vi.mocked(scraperModule.scrapeValenzuelaBusinessDatabank).mockRejectedValue(
        "Unexpected network failure string",
      );

      const result = await searchValenzuelaBusinessDatabank("Acme Rentals");

      expect(result.status).toBe("error");
      expect(result.rows).toEqual([]);
      expect(result.error).toBe("Failed to connect to Valenzuela Business Directory.");
      expect(result.source).toBe("valenzuela_business_databank");
      expect(result.checkedAt).toBeDefined();
    });
  });

  describe("generateValenzuelaSearchURL", () => {
    it("generates correct query URL for a given business name", () => {
      const url = generateValenzuelaSearchURL("Sunny Apartments");
      expect(url).toBe("https://bd.valenzuela.gov.ph/?business_name=Sunny+Apartments");
    });

    it("properly encodes special characters in business name", () => {
      const url = generateValenzuelaSearchURL("A & B Realty / Enterprises");
      expect(url).toContain("business_name=A+%26+B+Realty+%2F+Enterprises");
    });
  });
});
