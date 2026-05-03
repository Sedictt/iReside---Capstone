import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, MessageType } from "@/types/database";

type DbClient = SupabaseClient<Database>;

type ProfilePreview = {
    id: string;
    fullName: string;
    avatarUrl: string | null;
    avatarBgColor: string | null;
    role: Database["public"]["Enums"]["user_role"];
};

type MessagePreview = {
    id: string;
    conversationId: string;
    senderId: string;
    type: MessageType;
    content: string;
    metadata: Database["public"]["Tables"]["messages"]["Row"]["metadata"];
    readAt: string | null;
    createdAt: string;
};

export type ConversationSummary = {
    id: string;
    createdAt: string;
    updatedAt: string;
    participants: ProfilePreview[];
    otherParticipants: ProfilePreview[];
    relationshipStatus: "tenant_landlord" | "prospective" | "stranger";
    hasPaymentHistory: boolean;
    isArchived: boolean;
    isBlocked: boolean;
    lastMessage: MessagePreview | null;
    unreadCount: number;
};

const PARTNER_RELEVANT_APPLICATION_STATUSES: Database["public"]["Enums"]["application_status"][] = [
    "pending",
    "reviewing",
    "approved",
];

const resolvePartnerRelationshipData = async (
    supabase: DbClient,
    currentUserId: string,
    partnerIds: string[]
) => {
    const uniquePartnerIds = Array.from(new Set(partnerIds));
    if (uniquePartnerIds.length === 0) {
        return {
            leasePartnerIds: new Set<string>(),
            applicationPartnerIds: new Set<string>(),
            paymentPartnerIds: new Set<string>(),
        };
    }

    const [
        { data: tenantLeases, error: tenantLeasesError },
        { data: landlordLeases, error: landlordLeasesError },
        { data: tenantApplications, error: tenantApplicationsError },
        { data: landlordApplications, error: landlordApplicationsError },
        { data: tenantPayments, error: tenantPaymentsError },
        { data: landlordPayments, error: landlordPaymentsError },
    ] = await Promise.all([
        supabase
            .from("leases")
            .select("landlord_id")
            .eq("tenant_id", currentUserId)
            .in("landlord_id", uniquePartnerIds),
        supabase
            .from("leases")
            .select("tenant_id")
            .eq("landlord_id", currentUserId)
            .in("tenant_id", uniquePartnerIds),
        supabase
            .from("applications")
            .select("landlord_id")
            .eq("applicant_id", currentUserId)
            .in("landlord_id", uniquePartnerIds)
            .in("status", PARTNER_RELEVANT_APPLICATION_STATUSES),
        supabase
            .from("applications")
            .select("applicant_id")
            .eq("landlord_id", currentUserId)
            .in("applicant_id", uniquePartnerIds)
            .in("status", PARTNER_RELEVANT_APPLICATION_STATUSES),
        supabase
            .from("payments")
            .select("landlord_id")
            .eq("tenant_id", currentUserId)
            .in("landlord_id", uniquePartnerIds),
        supabase
            .from("payments")
            .select("tenant_id")
            .eq("landlord_id", currentUserId)
            .in("tenant_id", uniquePartnerIds),
    ]);

    if (tenantLeasesError || landlordLeasesError) {
        console.error("Failed to load lease relationships.", {
            tenantLeasesError,
            landlordLeasesError,
        });
    }

    if (tenantApplicationsError || landlordApplicationsError) {
        console.error("Failed to load application relationships.", {
            tenantApplicationsError,
            landlordApplicationsError,
        });
    }

    if (tenantPaymentsError || landlordPaymentsError) {
        console.error("Failed to load payment history relationships.", {
            tenantPaymentsError,
            landlordPaymentsError,
        });
    }

    const leasePartnerIds = new Set<string>([
        ...(tenantLeasesError ? [] : (tenantLeases ?? [])).map((row) => row.landlord_id),
        ...(landlordLeasesError ? [] : (landlordLeases ?? [])).map((row) => row.tenant_id),
    ]);

    const applicationPartnerIds = new Set<string>([
        ...(tenantApplicationsError ? [] : (tenantApplications ?? []))
            .map((row) => row.landlord_id)
            .filter((id): id is string => id !== null),
        ...(landlordApplicationsError ? [] : (landlordApplications ?? []))
            .map((row) => row.applicant_id)
            .filter((id): id is string => id !== null),
    ]);

    const paymentPartnerIds = new Set<string>([
        ...(tenantPaymentsError ? [] : (tenantPayments ?? [])).map((row) => row.landlord_id),
        ...(landlordPaymentsError ? [] : (landlordPayments ?? [])).map((row) => row.tenant_id),
    ]);

    return {
        leasePartnerIds,
        applicationPartnerIds,
        paymentPartnerIds,
    };
};

const resolvePartnerActionState = async (
    supabase: DbClient,
    currentUserId: string,
    partnerIds: string[]
) => {
    const uniquePartnerIds = Array.from(new Set(partnerIds));
    if (uniquePartnerIds.length === 0) {
        return new Map<string, { archived: boolean; blocked: boolean }>();
    }

    const { data, error } = await supabase
        .from("message_user_actions")
        .select("target_user_id, archived, blocked")
        .eq("actor_user_id", currentUserId)
        .in("target_user_id", uniquePartnerIds);

    if (error) {
        console.error("Failed to load message action state.", error);
        return new Map<string, { archived: boolean; blocked: boolean }>();
    }

    const actionMap = new Map<string, { archived: boolean; blocked: boolean }>();
    ((data ?? []) as Array<{ target_user_id: string; archived: boolean; blocked: boolean }>).forEach((row) => {
        actionMap.set(row.target_user_id, {
            archived: Boolean(row.archived),
            blocked: Boolean(row.blocked),
        });
    });

    return actionMap;
};

export const getProfilePreviewMap = async (supabase: DbClient, userIds: string[]) => {
    const uniqueIds = Array.from(new Set(userIds));
    if (uniqueIds.length === 0) {
        return new Map<string, ProfilePreview>();
    }

    const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url, avatar_bg_color, role")
        .in("id", uniqueIds);

    if (error) {
        throw new Error("Failed to load participant profiles.");
    }

    return new Map<string, ProfilePreview>(
        (data ?? []).map((row) => [
            row.id,
            {
                id: row.id,
                fullName: row.full_name,
                avatarUrl: row.avatar_url,
                avatarBgColor: row.avatar_bg_color,
                role: row.role,
            },
        ])
    );
};

export const getConversationIdsForUser = async (supabase: DbClient, userId: string) => {
    const { data, error } = await supabase
        .from("conversation_participants")
        .select("conversation_id")
        .eq("user_id", userId);

    if (error) {
        console.error("Failed to load user conversations.", {
            userId,
            error: error.message,
            code: error.code,
            details: error.details,
        });
        throw new Error(`Failed to load user conversations: ${error.message}`);
    }

    return Array.from(new Set((data ?? []).map((row) => row.conversation_id)));
};

export const getConversationParticipants = async (supabase: DbClient, conversationIds: string[]) => {
    if (conversationIds.length === 0) {
        return [] as Database["public"]["Tables"]["conversation_participants"]["Row"][];
    }

    const { data, error } = await supabase
        .from("conversation_participants")
        .select("id, conversation_id, user_id, created_at")
        .in("conversation_id", conversationIds);

    if (error) {
        throw new Error("Failed to load conversation participants.");
    }

    return data ?? [];
};

export const getLastMessagesByConversation = async (supabase: DbClient, conversationIds: string[]) => {
    if (conversationIds.length === 0) {
        return new Map<string, MessagePreview>();
    }

    const { data, error } = await supabase
        .from("messages")
        .select("id, conversation_id, sender_id, type, content, metadata, read_at, created_at")
        .in("conversation_id", conversationIds)
        .order("created_at", { ascending: false });

    if (error) {
        throw new Error("Failed to load last messages.");
    }

    const map = new Map<string, MessagePreview>();

    for (const row of data ?? []) {
        if (map.has(row.conversation_id)) continue;

        map.set(row.conversation_id, {
            id: row.id,
            conversationId: row.conversation_id,
            senderId: row.sender_id,
            type: row.type,
            content: row.content,
            metadata: row.metadata,
            readAt: row.read_at,
            createdAt: row.created_at,
        });
    }

    return map;
};

export const getUnreadCounts = async (supabase: DbClient, conversationIds: string[], currentUserId: string) => {
    if (conversationIds.length === 0) {
        return new Map<string, number>();
    }

    const { data, error } = await supabase
        .from("messages")
        .select("conversation_id")
        .in("conversation_id", conversationIds)
        .neq("sender_id", currentUserId)
        .is("read_at", null);

    if (error) {
        throw new Error("Failed to load unread counts.");
    }

    const counts = new Map<string, number>();
    for (const row of data ?? []) {
        counts.set(row.conversation_id, (counts.get(row.conversation_id) ?? 0) + 1);
    }

    return counts;
};

export const buildConversationSummaries = async (supabase: DbClient, currentUserId: string) => {
    const conversationIds = await getConversationIdsForUser(supabase, currentUserId);

    if (conversationIds.length === 0) {
        return [] as ConversationSummary[];
    }

    const { data: conversations, error: conversationsError } = await supabase
        .from("conversations")
        .select("id, created_at, updated_at")
        .in("id", conversationIds)
        .order("updated_at", { ascending: false });

    if (conversationsError) {
        throw new Error("Failed to load conversations.");
    }

    const participantRows = await getConversationParticipants(supabase, conversationIds);
    const participantIds = participantRows.map((row) => row.user_id);
    const profileMap = await getProfilePreviewMap(supabase, participantIds);
    const lastMessageMap = await getLastMessagesByConversation(supabase, conversationIds);
    const unreadCounts = await getUnreadCounts(supabase, conversationIds, currentUserId);

    const participantsByConversation = new Map<string, string[]>();

    for (const row of participantRows) {
        const arr = participantsByConversation.get(row.conversation_id) ?? [];
        arr.push(row.user_id);
        participantsByConversation.set(row.conversation_id, arr);
    }

    const partnerIds = conversationIds
        .map((conversationId) => {
            const participantIdsForConversation = participantsByConversation.get(conversationId) ?? [];
            return participantIdsForConversation.find((id) => id !== currentUserId) ?? null;
        })
        .filter((id): id is string => Boolean(id));

    const { leasePartnerIds, applicationPartnerIds, paymentPartnerIds } = await resolvePartnerRelationshipData(
        supabase,
        currentUserId,
        partnerIds
    );
    const partnerActionState = await resolvePartnerActionState(supabase, currentUserId, partnerIds);

    return (conversations ?? []).map((conv) => {
        const participantIdsForConversation = participantsByConversation.get(conv.id) ?? [];
        const participants = participantIdsForConversation
            .map((id) => profileMap.get(id))
            .filter((profile): profile is ProfilePreview => Boolean(profile));
        const otherParticipants = participants.filter((profile) => profile.id !== currentUserId);
        const primaryOtherParticipant = otherParticipants[0] ?? null;

        const relationshipStatus: ConversationSummary["relationshipStatus"] = primaryOtherParticipant
            ? leasePartnerIds.has(primaryOtherParticipant.id)
                ? "tenant_landlord"
                : applicationPartnerIds.has(primaryOtherParticipant.id)
                    ? "prospective"
                    : "stranger"
            : "stranger";
        const actionState = primaryOtherParticipant
            ? partnerActionState.get(primaryOtherParticipant.id) ?? { archived: false, blocked: false }
            : { archived: false, blocked: false };

        return {
            id: conv.id,
            createdAt: conv.created_at,
            updatedAt: conv.updated_at,
            participants,
            otherParticipants,
            relationshipStatus,
            hasPaymentHistory: primaryOtherParticipant ? paymentPartnerIds.has(primaryOtherParticipant.id) : false,
            isArchived: actionState.archived,
            isBlocked: actionState.blocked,
            lastMessage: lastMessageMap.get(conv.id) ?? null,
            unreadCount: unreadCounts.get(conv.id) ?? 0,
        };
    });
};

export const ensureUserInConversation = async (supabase: DbClient, conversationId: string, userId: string) => {
    const { data, error } = await supabase
        .from("conversation_participants")
        .select("id")
        .eq("conversation_id", conversationId)
        .eq("user_id", userId)
        .maybeSingle();

    if (error) {
        throw new Error("Failed to verify conversation membership.");
    }

    return Boolean(data);
};

export const findDirectConversation = async (
    supabase: DbClient,
    currentUserId: string,
    otherUserId: string
) => {
    const { data: mine, error: mineError } = await supabase
        .from("conversation_participants")
        .select("conversation_id")
        .eq("user_id", currentUserId);

    if (mineError) {
        throw new Error("Failed to check existing conversations.");
    }

    const myConversationIds = (mine ?? []).map((row) => row.conversation_id);
    if (myConversationIds.length === 0) {
        return null;
    }

    const { data: other, error: otherError } = await supabase
        .from("conversation_participants")
        .select("conversation_id")
        .eq("user_id", otherUserId)
        .in("conversation_id", myConversationIds);

    if (otherError) {
        throw new Error("Failed to check recipient conversations.");
    }

    const overlap = new Set((other ?? []).map((row) => row.conversation_id));
    if (overlap.size === 0) {
        return null;
    }

    const overlapIds = Array.from(overlap);

    const { data: participantRows, error: participantError } = await supabase
        .from("conversation_participants")
        .select("conversation_id")
        .in("conversation_id", overlapIds);

    if (participantError) {
        throw new Error("Failed to evaluate direct conversations.");
    }

    const counts = new Map<string, number>();
    (participantRows ?? []).forEach((row) => {
        counts.set(row.conversation_id, (counts.get(row.conversation_id) ?? 0) + 1);
    });

    const directConversationIds = overlapIds.filter((id) => counts.get(id) === 2);
    if (directConversationIds.length === 0) {
        return null;
    }

    const { data: conversations, error: conversationError } = await supabase
        .from("conversations")
        .select("id, updated_at")
        .in("id", directConversationIds)
        .order("updated_at", { ascending: false })
        .limit(1);

    if (conversationError) {
        throw new Error("Failed to load direct conversation metadata.");
    }

    return conversations?.[0]?.id ?? null;
};
