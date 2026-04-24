export type ConversationSummary = {
    id: string;
    createdAt: string;
    updatedAt: string;
    unreadCount: number;
    relationshipStatus: "tenant_landlord" | "prospective" | "stranger";
    hasPaymentHistory: boolean;
    isArchived: boolean;
    isBlocked: boolean;
    otherParticipants: Array<{
        id: string;
        fullName: string;
        avatarUrl: string | null;
        avatarBgColor: string | null;
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
        avatarBgColor: string | null;
        role: "tenant" | "landlord";
    } | null;
    type: "text" | "system" | "image" | "file";
    content: string;
    metadata: Record<string, unknown> | null;
    readAt: string | null;
    createdAt: string;
};

export type UploadedConversationFile = {
    message: {
        id: string;
        conversationId: string;
        senderId: string;
        type: "text" | "system" | "image" | "file";
        content: string;
        metadata: Record<string, unknown> | null;
        readAt: string | null;
        createdAt: string;
    };
    file: {
        name: string;
        size: number;
        mimeType: string;
        url: string;
        path: string;
    };
};

export type PaymentHistoryEntry = {
    id: string;
    amount: number;
    statusLabel: string;
    statusTone: "paid" | "pending" | "failed" | "refunded";
    methodLabel: string;
    typeLabel: string;
    monthLabel: string;
    dateLabel: string;
};

export type PaymentHistoryPayload = {
    payments: PaymentHistoryEntry[];
    totalPaid: number;
};

const IMAGE_MAX_DIMENSION = 1600;
const IMAGE_OUTPUT_QUALITY = 0.82;

const optimizeImageForUpload = async (file: File): Promise<File> => {
    if (!file.type.startsWith("image/")) {
        return file;
    }

    // Keep animated/vector formats untouched.
    if (file.type === "image/gif" || file.type === "image/svg+xml") {
        return file;
    }

    const objectUrl = URL.createObjectURL(file);

    try {
        const image = await new Promise<HTMLImageElement>((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = () => reject(new Error("Failed to decode image."));
            img.src = objectUrl;
        });

        const { width, height } = image;
        if (!width || !height) {
            return file;
        }

        const scale = Math.min(1, IMAGE_MAX_DIMENSION / Math.max(width, height));
        const targetWidth = Math.max(1, Math.round(width * scale));
        const targetHeight = Math.max(1, Math.round(height * scale));

        const canvas = document.createElement("canvas");
        canvas.width = targetWidth;
        canvas.height = targetHeight;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
            return file;
        }

        ctx.drawImage(image, 0, 0, targetWidth, targetHeight);

        const optimizedBlob = await new Promise<Blob | null>((resolve) => {
            canvas.toBlob(resolve, "image/webp", IMAGE_OUTPUT_QUALITY);
        });

        if (!optimizedBlob) {
            return file;
        }

        // Keep original when optimization doesn't materially reduce size.
        if (optimizedBlob.size >= file.size * 0.95) {
            return file;
        }

        const safeBaseName = file.name.replace(/\.[^.]+$/, "") || "image";
        return new File([optimizedBlob], `${safeBaseName}.webp`, {
            type: "image/webp",
            lastModified: Date.now(),
        });
    } catch {
        return file;
    } finally {
        URL.revokeObjectURL(objectUrl);
    }
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
    avatarBgColor: string | null;
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

const buildPaymentHistoryErrorMessage = (status: number, detail = "") => {
    const detailSuffix = detail ? ` (${detail})` : "";

    if (status === 401) {
        return "Your session expired. Please sign in again.";
    }
    if (status === 403) {
        return "You do not have access to this payment history.";
    }
    if (status >= 500) {
        return `Unable to load payment history right now. Please try again shortly.${detailSuffix}`;
    }
    return `Unable to load payment history right now.${detailSuffix}`;
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
    metadata?: Record<string, unknown> | null,
    type: "text" | "system" | "image" | "file" = "text"
) => {
    const response = await fetch(`/api/messages/conversations/${conversationId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            content,
            type,
            metadata: metadata ?? null,
        }),
    });

    if (!response.ok) {
        const detail = await response.text().catch(() => "");
        let errorMessage: string | null = null;
        try {
            const parsed = JSON.parse(detail);
            if (parsed && typeof parsed === "object" && typeof parsed.error === "string") {
                errorMessage = parsed.error;
            }
        } catch {
            // parse err
        }
        if (errorMessage) {
            throw new Error(errorMessage);
        }
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

export const uploadConversationFile = async (
    conversationId: string,
    file: File,
    onProgress?: (percent: number) => void
) => {
    const preparedFile = await optimizeImageForUpload(file);
    const body = new FormData();
    body.append("file", preparedFile);

    return await new Promise<UploadedConversationFile>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("POST", `/api/messages/conversations/${conversationId}/files`, true);

        xhr.upload.onprogress = (event) => {
            if (!onProgress || !event.lengthComputable) {
                return;
            }

            const percent = Math.max(0, Math.min(100, Math.round((event.loaded / event.total) * 100)));
            onProgress(percent);
        };

        xhr.onload = () => {
            const status = xhr.status;
            const text = xhr.responseText || "";

            let payload: unknown = null;
            try {
                payload = text ? JSON.parse(text) : null;
            } catch {
                payload = null;
            }

            if (status < 200 || status >= 300) {
                const detail =
                    payload && typeof payload === "object" && "error" in payload && typeof (payload as { error?: unknown }).error === "string"
                        ? (payload as { error: string }).error
                        : "";
                reject(new Error(detail || `Failed to upload file. Status: ${status}.`));
                return;
            }

            if (!payload || typeof payload !== "object") {
                reject(new Error("Invalid upload response."));
                return;
            }

            resolve(payload as UploadedConversationFile);
        };

        xhr.onerror = () => {
            reject(new Error("Failed to upload file due to a network issue."));
        };

        xhr.send(body);
    });
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

export const fetchConversationPaymentHistory = async (conversationId: string, limit = 50) => {
    try {
        const response = await fetch(`/api/messages/conversations/${conversationId}/payments?limit=${limit}`, {
            method: "GET",
            cache: "no-store",
        });

        if (!response.ok) {
            const detail = await parseErrorDetail(response);
            console.warn("Failed to fetch payment history", { conversationId, status: response.status, detail });
            return {
                data: { payments: [], totalPaid: 0 },
                error: buildPaymentHistoryErrorMessage(response.status, detail),
            };
        }

        const payload = (await response.json()) as PaymentHistoryPayload;
        return {
            data: {
                payments: payload.payments ?? [],
                totalPaid: payload.totalPaid ?? 0,
            },
            error: null,
        };
    } catch {
        console.warn("Failed to fetch payment history due to a network or parsing issue.", { conversationId });
        return {
            data: { payments: [], totalPaid: 0 },
            error: "Unable to load payment history right now. Please check your connection and try again.",
        };
    }
};
