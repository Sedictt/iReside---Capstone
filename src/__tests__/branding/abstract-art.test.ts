import { describe, expect, it } from "vitest";
import { ART, BANNER_ART_PRESETS, DEFAULT_BANNER_ART_URL, artOr, isRetiredPhotoUrl, resolveBannerUrl } from "@/lib/art/abstract-art";

describe("abstract art", () => {
  it("maps each old stock-photo banner preset to the art that replaced it", () => {
    for (const preset of BANNER_ART_PRESETS) {
      const oldUrl = `https://images.unsplash.com/${preset.legacyPhotoId}?q=80&w=2070&auto=format&fit=crop`;
      expect(resolveBannerUrl(oldUrl)).toBe(preset.url);
    }
  });

  it("maps any other retired photo to the default art and keeps uploads", () => {
    expect(resolveBannerUrl("https://images.unsplash.com/photo-1?w=800")).toBe(DEFAULT_BANNER_ART_URL);
    expect(resolveBannerUrl("/hero-images/apartment-03.png")).toBe(DEFAULT_BANNER_ART_URL);
    const upload = "https://abc.supabase.co/storage/v1/object/public/banners/x.jpg";
    expect(resolveBannerUrl(upload)).toBe(upload);
    expect(resolveBannerUrl(null)).toBeNull();
  });

  it("falls back to art for empty or retired image links", () => {
    expect(artOr(undefined, ART.property)).toBe(ART.property);
    expect(artOr("/utilities/sky_pool.png", ART.amenity)).toBe(ART.amenity);
    expect(artOr("/art/property.svg", ART.amenity)).toBe("/art/property.svg");
    expect(isRetiredPhotoUrl("/amenities/pool.png")).toBe(true);
    expect(isRetiredPhotoUrl("/logos/primary.png")).toBe(false);
  });
});
