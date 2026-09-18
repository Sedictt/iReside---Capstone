/**
 * Default amenities provided across property setup wizards.
 */
export const DEFAULT_PROPERTY_AMENITIES: readonly string[] = [
    "Wi-Fi",
    "Gym",
    "Pool",
    "Laundry",
    "Parking",
    "Security",
    "CCTV",
    "Garden",
    "Elevator",
] as const;

/**
 * Normalizes an amenity string for clean presentation and comparison.
 */
export function normalizeAmenityName(name: string): string {
    const trimmed = name.trim().replace(/\s+/g, " ");
    if (!trimmed) return "";
    // If entered in lowercase or mixed without special casing, format title case
    if (trimmed === trimmed.toLowerCase()) {
        return trimmed
            .split(" ")
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(" ");
    }
    return trimmed;
}

/**
 * Checks if an amenity already exists in a given list (case-insensitive).
 */
export function isAmenityDuplicate(amenity: string, existingList: readonly string[] | string[]): boolean {
    const normalized = amenity.trim().toLowerCase();
    if (!normalized) return false;
    return existingList.some(item => item.trim().toLowerCase() === normalized);
}

/**
 * Merges default and custom amenities without case-insensitive duplicates.
 */
export function mergeAmenities(defaults: readonly string[], customs: readonly string[]): string[] {
    const result = [...defaults];
    for (const custom of customs) {
        const trimmed = normalizeAmenityName(custom);
        if (trimmed && !isAmenityDuplicate(trimmed, result)) {
            result.push(trimmed);
        }
    }
    return result;
}
