export type IrisHistoryMessage = {
    id: string;
    role: "user" | "assistant";
    content: string;
    metadata: Record<string, unknown> | null;
    created_at: string;
};

export type IrisHistoryFetchResult = {
    data: IrisHistoryMessage[];
    error: string | null;
    fromCache?: boolean;
};

type IrisHistoryCacheEntry = {
    fetchedAt: number;
    data: IrisHistoryMessage[];
};

type FetchIrisHistoryOptions = {
    userId?: string;
    useCache?: boolean;
    forceRefresh?: boolean;
};

const IRIS_HISTORY_CACHE_PREFIX = "ireside:iris-history:v1";
const IRIS_HISTORY_CACHE_TTL_MS = 5 * 60 * 1000;
const memoryCache = new Map<string, IrisHistoryCacheEntry>();

const isIrisHistoryMessage = (value: unknown): value is IrisHistoryMessage => {
    if (!value || typeof value !== "object") {
        return false;
    }

    const candidate = value as Partial<IrisHistoryMessage>;
    return (
        typeof candidate.id === "string" &&
        (candidate.role === "user" || candidate.role === "assistant") &&
        typeof candidate.content === "string" &&
        typeof candidate.created_at === "string"
    );
};

const getCacheStorageKey = (userId: string) => `${IRIS_HISTORY_CACHE_PREFIX}:${userId}`;

const isFresh = (entry: IrisHistoryCacheEntry) => Date.now() - entry.fetchedAt < IRIS_HISTORY_CACHE_TTL_MS;

const writeCacheEntry = (userId: string, entry: IrisHistoryCacheEntry) => {
    memoryCache.set(userId, entry);

    if (typeof window === "undefined") {
        return;
    }

    try {
        window.sessionStorage.setItem(getCacheStorageKey(userId), JSON.stringify(entry));
    } catch {
        // Ignore storage errors.
    }
};

const readSessionCacheEntry = (userId: string): IrisHistoryCacheEntry | null => {
    if (typeof window === "undefined") {
        return null;
    }

    try {
        const raw = window.sessionStorage.getItem(getCacheStorageKey(userId));
        if (!raw) {
            return null;
        }

        const parsed = JSON.parse(raw) as Partial<IrisHistoryCacheEntry> | null;
        if (!parsed || typeof parsed.fetchedAt !== "number" || !Array.isArray(parsed.data)) {
            return null;
        }

        const safeData = parsed.data.filter(isIrisHistoryMessage);
        return {
            fetchedAt: parsed.fetchedAt,
            data: safeData,
        };
    } catch {
        return null;
    }
};

export const getCachedIrisHistory = (userId: string, allowStale = false): IrisHistoryMessage[] | null => {
    const memEntry = memoryCache.get(userId);
    if (memEntry && (allowStale || isFresh(memEntry))) {
        return memEntry.data;
    }

    const sessionEntry = readSessionCacheEntry(userId);
    if (!sessionEntry) {
        return null;
    }

    memoryCache.set(userId, sessionEntry);
    if (!allowStale && !isFresh(sessionEntry)) {
        return null;
    }

    return sessionEntry.data;
};

export const setCachedIrisHistory = (userId: string, messages: IrisHistoryMessage[]) => {
    writeCacheEntry(userId, {
        fetchedAt: Date.now(),
        data: messages,
    });
};

export const fetchIrisHistory = async (limit = 100, options: FetchIrisHistoryOptions = {}): Promise<IrisHistoryFetchResult> => {
    const { userId, useCache = true, forceRefresh = false } = options;

    if (userId && useCache && !forceRefresh) {
        const cached = getCachedIrisHistory(userId);
        if (cached) {
            return {
                data: cached,
                error: null,
                fromCache: true,
            };
        }
    }

    try {
        const response = await fetch(`/api/iris/history?limit=${limit}`, {
            method: "GET",
            cache: "no-store",
        });

        if (!response.ok) {
            const detail = await response.text().catch(() => "");
            return {
                data: [],
                error: detail || "Unable to load iRis chat history.",
            };
        }

        const payload = (await response.json()) as { messages?: IrisHistoryMessage[] };
        const safeMessages = Array.isArray(payload.messages) ? payload.messages.filter(isIrisHistoryMessage) : [];

        if (userId) {
            setCachedIrisHistory(userId, safeMessages);
        }

        return {
            data: safeMessages,
            error: null,
            fromCache: false,
        };
    } catch {
        return {
            data: [],
            error: "Unable to load iRis chat history right now.",
        };
    }
};
