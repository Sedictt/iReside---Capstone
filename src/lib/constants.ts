export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
export const MAX_FILE_SIZE_MB = 5;

export const ALLOWED_FILE_TYPES = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "application/pdf",
];

export const DEFAULT_AVATAR_URL = "https://hlpgsiqyrtndqdgvttcr.supabase.co/storage/v1/object/public/profile-avatars/default_avatars/3.png";
export const DEFAULT_AVATAR_BG_COLOR = "#8B5CF6";

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
