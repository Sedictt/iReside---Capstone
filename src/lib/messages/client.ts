export type ConversationSummary = {
    id: string;
    createdAt: string;
    updatedAt: string;
    unreadCount: number;
    otherParticipants: Array<{
        id: string;
        fullName: string;
        avatarUrl: string | null;
        role: "tenant" | "landlord";
    }>;
    lastMessage: {
        id: string;
        content: string;
        createdAt: string;
        senderId: string;
        type: "text" | "system" | "image" | "file";
    } | null;
};

export type ConversationMessage = {
    id: string;
    conversationId: string;
    senderId: string;
    sender: {
        id: string;
        fullName: string;
        avatarUrl: string | null;
        role: "tenant" | "landlord";
    } | null;
    type: "text" | "system" | "image" | "file";
    content: string;
    metadata: Record<string, unknown> | null;
    readAt: string | null;
    createdAt: string;
};

export type ListFetchResult<T> = {
    data: T[];
    error: string | null;
};

export type MessageUserSearchResult = {
    id: string;
    fullName: string;
    email: string;
    avatarUrl: string | null;
    role: "tenant" | "landlord";
};

const parseErrorDetail = async (response: Response) => {
    const contentType = response.headers.get("content-type") ?? "";

    if (contentType.includes("application/json")) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null;
        return payload?.error ?? "";
    }

    return await response.text().catch(() => "");
};

const buildListFetchErrorMessage = (entity: "conversations" | "messages", status: number, detail = "") => {
    const detailSuffix = detail ? ` (${detail})` : "";

    if (status === 401) {
        return "Your session expired. Please sign in again.";
    }
    if (status === 403) {
        return `You do not have access to these ${entity}.`;
    }
    if (status >= 500) {
        return `Unable to load ${entity} right now. Please try again shortly.${detailSuffix}`;
    }
    return `Unable to load ${entity} right now.${detailSuffix}`;
};

export const fetchConversations = async () => {
    try {
        const response = await fetch("/api/messages/conversations", {
            method: "GET",
            cache: "no-store",
        });

        if (!response.ok) {
            const detail = await parseErrorDetail(response);
            console.warn("Failed to fetch conversations", { status: response.status, detail });
            return {
                data: [],
                error: buildListFetchErrorMessage("conversations", response.status, detail),
            } satisfies ListFetchResult<ConversationSummary>;
        }

        const payload = (await response.json()) as { conversations?: ConversationSummary[] };
        return {
            data: payload.conversations ?? [],
            error: null,
        } satisfies ListFetchResult<ConversationSummary>;
    } catch {
        console.warn("Failed to fetch conversations due to a network or parsing issue.");
        return {
            data: [],
            error: "Unable to load conversations right now. Please check your connection and try again.",
        } satisfies ListFetchResult<ConversationSummary>;
    }
};

export const fetchConversationMessages = async (conversationId: string, limit = 100) => {
    try {
        const response = await fetch(`/api/messages/conversations/${conversationId}?limit=${limit}`, {
            method: "GET",
            cache: "no-store",
        });

        if (!response.ok) {
            const detail = await parseErrorDetail(response);
            console.warn("Failed to fetch messages", { conversationId, status: response.status, detail });
            return {
                data: [],
                error: buildListFetchErrorMessage("messages", response.status, detail),
            } satisfies ListFetchResult<ConversationMessage>;
        }

        const payload = (await response.json()) as { messages?: ConversationMessage[] };
        return {
            data: payload.messages ?? [],
            error: null,
        } satisfies ListFetchResult<ConversationMessage>;
    } catch {
        console.warn("Failed to fetch messages due to a network or parsing issue.", { conversationId });
        return {
            data: [],
            error: "Unable to load messages right now. Please check your connection and try again.",
        } satisfies ListFetchResult<ConversationMessage>;
    }
};

export const sendConversationMessage = async (
    conversationId: string,
    content: string,
    metadata?: Record<string, unknown> | null
) => {
    const response = await fetch(`/api/messages/conversations/${conversationId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            content,
            type: "text",
            metadata: metadata ?? null,
        }),
    });

    if (!response.ok) {
        const detail = await response.text().catch(() => "");
        throw new Error(`Failed to send message. Status: ${response.status}. ${detail}`);
    }

    const payload = (await response.json()) as {
        message?: {
            id: string;
            conversationId: string;
            senderId: string;
            type: "text" | "system" | "image" | "file";
            content: string;
            metadata: Record<string, unknown> | null;
            readAt: string | null;
            createdAt: string;
        };
    };

    if (!payload.message) {
        throw new Error("Message send response is missing message payload.");
    }

    return payload.message;
};

export const markConversationAsRead = async (conversationId: string) => {
    const response = await fetch(`/api/messages/conversations/${conversationId}/read`, {
        method: "PATCH",
    });

    if (!response.ok) {
        const detail = await response.text().catch(() => "");
        console.warn("Failed to mark conversation as read", { conversationId, status: response.status, detail });
    }
};

export const searchMessageUsers = async (query: string, limit = 8) => {
    const normalizedQuery = query.trim();
    if (normalizedQuery.length < 2) {
        return {
            data: [],
            error: null,
        } satisfies ListFetchResult<MessageUserSearchResult>;
    }

    try {
        const params = new URLSearchParams({
            q: normalizedQuery,
            limit: String(limit),
        });

        const response = await fetch(`/api/messages/users?${params.toString()}`, {
            method: "GET",
            cache: "no-store",
        });

        if (!response.ok) {
            const detail = await parseErrorDetail(response);
            console.warn("Failed to search users", { status: response.status, detail });

            const message = response.status === 401
                ? "Your session expired. Please sign in again."
                : "Unable to search users right now.";

            return {
                data: [],
                error: message,
            } satisfies ListFetchResult<MessageUserSearchResult>;
        }

        const payload = (await response.json()) as { users?: MessageUserSearchResult[] };
        return {
            data: payload.users ?? [],
            error: null,
        } satisfies ListFetchResult<MessageUserSearchResult>;
    } catch {
        console.warn("Failed to search users due to a network or parsing issue.");
        return {
            data: [],
            error: "Unable to search users right now. Please check your connection and try again.",
        } satisfies ListFetchResult<MessageUserSearchResult>;
    }
};

export const createOrGetDirectConversation = async (participantId: string) => {
    const response = await fetch("/api/messages/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ participantIds: [participantId] }),
    });

    if (!response.ok) {
        const detail = await parseErrorDetail(response);
        throw new Error(`Failed to create conversation. Status: ${response.status}. ${detail}`);
    }

    const payload = (await response.json()) as { conversationId?: string };
    if (!payload.conversationId) {
        throw new Error("Conversation creation response is missing conversationId.");
    }

    return payload.conversationId;
};
