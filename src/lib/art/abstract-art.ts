/**
 * Abstract SVG art used wherever the app needs a picture that the user did not upload.
 * The app never ships stock or AI-generated photos; the SVGs live in public/art.
 */

export const ART = {
  property: "/art/property.svg",
  avatar: "/art/avatar.svg",
  amenity: "/art/amenity.svg",
  repair: "/art/repair.svg",
  workspace: "/art/workspace.svg",
} as const;

export interface BannerArtPreset {
  id: string;
  name: string;
  category: string;
  url: string;
  /** Unsplash photo id of the photo this preset replaced, so old saved choices map over. */
  legacyPhotoId: string;
}

export const BANNER_ART_PRESETS: BannerArtPreset[] = [
  { id: "violet_arches", name: "Violet arches", category: "Calm", url: "/art/banners/violet-arches.svg", legacyPhotoId: "photo-1486406146926-c627a92ad1ab" },
  { id: "night_blocks", name: "City at night", category: "Dark", url: "/art/banners/night-blocks.svg", legacyPhotoId: "photo-1545324418-cc1a3fa10c00" },
  { id: "morning_sun", name: "Morning sun", category: "Warm", url: "/art/banners/morning-sun.svg", legacyPhotoId: "photo-1600585154340-be6161a56a0c" },
  { id: "clay_waves", name: "Clay waves", category: "Warm", url: "/art/banners/clay-waves.svg", legacyPhotoId: "photo-1568605114967-8130f3a36994" },
  { id: "sea_tiles", name: "Sea tiles", category: "Bright", url: "/art/banners/sea-tiles.svg", legacyPhotoId: "photo-1512917774080-9991f1c4c750" },
  { id: "evening_hills", name: "Evening hills", category: "Calm", url: "/art/banners/evening-hills.svg", legacyPhotoId: "photo-1577495508048-b635879837f1" },
];

export const DEFAULT_BANNER_ART_URL = BANNER_ART_PRESETS[0].url;

/** Stock-photo links and old bundled photos that must no longer be shown. */
const RETIRED_PHOTO_PATTERN = /images\.unsplash\.com|images\.pexels\.com|\/hero-images\/|\/(?:amenities|utilities)\/[\w-]+\.png|ebook_workspace_bg/i;

export function isRetiredPhotoUrl(url: string | null | undefined): boolean {
  return Boolean(url && RETIRED_PHOTO_PATTERN.test(url));
}

/** Returns the url, or the fallback art when the url is empty or a retired stock photo. */
export function artOr(url: string | null | undefined, fallback: string): string {
  return url && !isRetiredPhotoUrl(url) ? url : fallback;
}

/**
 * Maps a saved dashboard banner to what should be shown. Old photo presets map to the
 * art preset that replaced them; any other retired photo maps to the default art.
 * Uploaded photos and null pass through unchanged.
 */
export function resolveBannerUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  if (!isRetiredPhotoUrl(url)) return url;
  const preset = BANNER_ART_PRESETS.find((p) => url.includes(p.legacyPhotoId));
  return preset ? preset.url : DEFAULT_BANNER_ART_URL;
}
