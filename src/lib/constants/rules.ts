/**
 * Default standard building rules provided across property setup wizards.
 */
export const DEFAULT_PROPERTY_RULES: readonly string[] = [
    "No Smoking",
    "Quiet Hours (10 PM - 8 AM)",
    "No Unauthorized Pets",
    "Keep Common Areas Clean",
    "Proper Waste Disposal",
    "No Subleasing Without Consent",
] as const;

/**
 * Normalizes a rule string for clean presentation and comparison.
 */
export function normalizeRuleText(text: string): string {
    const trimmed = text.trim().replace(/\s+/g, " ");
    if (!trimmed) return "";
    // Capitalize first character if lowercase
    return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
}

/**
 * Checks if a rule already exists in a given list (case-insensitive).
 */
export function isRuleDuplicate(rule: string, existingList: readonly string[] | string[]): boolean {
    const normalized = rule.trim().toLowerCase();
    if (!normalized) return false;
    return existingList.some((item) => item.trim().toLowerCase() === normalized);
}

/**
 * Merges default and custom rules without duplicates.
 */
export function mergeRules(defaults: readonly string[], customs: readonly string[]): string[] {
    const result = [...defaults];
    for (const custom of customs) {
        const trimmed = normalizeRuleText(custom);
        if (trimmed && !isRuleDuplicate(trimmed, result)) {
            result.push(trimmed);
        }
    }
    return result;
}
