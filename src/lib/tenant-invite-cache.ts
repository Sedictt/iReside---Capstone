export interface CachedInvites {
    data: unknown;
    expiresAt: number;
}

export const invitesMemoryCache = new Map<string, CachedInvites>();

export function invalidateInvitesCache(userId: string) {
    invitesMemoryCache.delete(userId);
}
