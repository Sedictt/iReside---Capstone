export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
export const MAX_FILE_SIZE_MB = 5;

export const ALLOWED_FILE_TYPES = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "application/pdf",
];

export const DEFAULT_AVATARS_BUCKET_URL = "https://hlpgsiqyrtndqdgvttcr.supabase.co/storage/v1/object/public/profile-avatars/default_avatars/";
export const DEFAULT_AVATARS_COUNT = 16; // Avatars 3 to 18
export const DEFAULT_AVATAR_URL = `${DEFAULT_AVATARS_BUCKET_URL}3.png`;
export const DEFAULT_AVATAR_BG_COLOR = "#8B5CF6";

/**
 * Returns a system avatar URL from the curated Supabase default avatars library (3.png to 18.png).
 * Can be selected by index/number or deterministically seeded by a string (name, user id, or email).
 */
export function getSystemAvatarUrl(indexOrSeed?: number | string | null): string {
    if (indexOrSeed === null || indexOrSeed === undefined) {
        return DEFAULT_AVATAR_URL;
    }
    if (typeof indexOrSeed === "number") {
        const avatarNum = (Math.abs(Math.floor(indexOrSeed)) % DEFAULT_AVATARS_COUNT) + 3;
        return `${DEFAULT_AVATARS_BUCKET_URL}${avatarNum}.png`;
    }
    if (typeof indexOrSeed === "string") {
        const trimmed = indexOrSeed.trim();
        if (!trimmed) return DEFAULT_AVATAR_URL;

        // Extract digits if numeric suffix present (e.g., "practice.tenant5@ireside.ph" -> 5)
        const match = trimmed.match(/\d+/);
        if (match) {
            const num = parseInt(match[0], 10);
            if (!isNaN(num)) {
                const avatarNum = (Math.abs(num) % DEFAULT_AVATARS_COUNT) + 3;
                return `${DEFAULT_AVATARS_BUCKET_URL}${avatarNum}.png`;
            }
        }

        // Otherwise deterministic string hash
        let hash = 0;
        for (let i = 0; i < trimmed.length; i++) {
            hash = (hash << 5) - hash + trimmed.charCodeAt(i);
            hash |= 0;
        }
        const avatarNum = (Math.abs(hash) % DEFAULT_AVATARS_COUNT) + 3;
        return `${DEFAULT_AVATARS_BUCKET_URL}${avatarNum}.png`;
    }
    return DEFAULT_AVATAR_URL;
}

/**
 * Normalizes legacy dark default background colors (#171717, #000000, etc.) to the brand default.
 */
export function getSafeAvatarBgColor(color?: string | null): string {
    const raw = color?.trim().toLowerCase();
    if (!raw || raw === "#171717" || raw === "#000000" || raw === "#0a0a0a" || raw === "#121212" || raw === "#18181b") {
        return DEFAULT_AVATAR_BG_COLOR;
    }
    return color!.trim();
}

/**
 * Determines whether a profile is incomplete (missing custom avatar, phone, or bio).
 */
export function isProfileIncomplete(profile?: {
    avatar_url?: string | null;
    phone?: string | null;
    bio?: string | null;
} | null): boolean {
    if (!profile) return false;
    const hasAvatar = Boolean(profile.avatar_url && profile.avatar_url.trim().length > 0);
    const hasPhone = Boolean(profile.phone && profile.phone.trim().length > 0);
    const hasBio = Boolean(profile.bio && profile.bio.trim().length > 0);
    return !hasAvatar || !hasPhone || !hasBio;
}
