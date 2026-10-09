import { NextRequest, NextResponse } from "next/server";
import { requireAuthenticatedUser } from "@/lib/api/auth-guard";
import { createServiceRoleSupabaseClient } from "@/lib/supabase/admin";
import { ensureUserInConversation, findDirectConversation } from "@/lib/messages/engine";
import { parseJsonBody, parseSearchParams } from "@/lib/validation/server";
import { sanitizeSearchTerm, unitMessageSendSchema, unitMessagesQuerySchema } from "@/lib/validation/schemas/operations.schema";

type ServiceClient = ReturnType<typeof createServiceRoleSupabaseClient>;

/** Latest tenant on a unit, only when the unit belongs to one of this landlord's properties. */
async function findTenantForOwnedUnit(supabase: ServiceClient, landlordId: string, unitId: string): Promise<string | null> {
    const { data: unit } = await supabase
        .from("units")
        .select("id, properties!inner(landlord_id)")
        .eq("id", unitId)
        .eq("properties.landlord_id", landlordId)
        .maybeSingle();
    if (!unit) return null;

    const { data: lease } = await supabase
        .from("leases")
        .select("tenant_id")
        .eq("unit_id", unitId)
        .eq("landlord_id", landlordId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
    return lease?.tenant_id ?? null;
}

/** True when the given user is (or was) a tenant on one of this landlord's leases. */
async function isLandlordTenant(supabase: ServiceClient, landlordId: string, tenantId: string): Promise<boolean> {
    const { data } = await supabase
        .from("leases")
        .select("id")
        .eq("landlord_id", landlordId)
        .eq("tenant_id", tenantId)
        .limit(1)
        .maybeSingle();
    return Boolean(data);
}

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
    const authContext = await requireAuthenticatedUser(request);
    if (!("userId" in authContext)) return authContext as any;
    const { userId } = authContext;

    const parsedQuery = parseSearchParams(request.nextUrl.searchParams, unitMessagesQuerySchema);
    if (!parsedQuery.ok) return parsedQuery.response;
    const { unitId, tenantName } = parsedQuery.data;

    try {
        const supabase = createServiceRoleSupabaseClient();
        let tenantUserId: string | null = null;

        // 1. Try finding tenant from the latest lease on this (owned) unit
        if (unitId) {
            tenantUserId = await findTenantForOwnedUnit(supabase, userId, unitId);
        }

        // 2. Fallback: match the tenant by name, limited to this landlord's own tenants
        const safeTenantName = tenantName ? sanitizeSearchTerm(tenantName) : "";
        if (!tenantUserId && safeTenantName) {
            const { data: landlordLeases } = await supabase
                .from("leases")
                .select("tenant_id")
                .eq("landlord_id", userId);
            const tenantIds = Array.from(new Set((landlordLeases ?? []).map((lease) => lease.tenant_id).filter(Boolean)));

            if (tenantIds.length > 0) {
                const { data: profile } = await supabase
                    .from("profiles")
                    .select("id")
                    .in("id", tenantIds)
                    .ilike("full_name", `%${safeTenantName}%`)
                    .limit(1)
                    .maybeSingle();

                if (profile?.id) {
                    tenantUserId = profile.id;
                }
            }
        }

        if (!tenantUserId) {
            return NextResponse.json({ conversationId: null, tenantUserId: null, messages: [] });
        }

        // 3. Find existing direct conversation ID
        const conversationId = await findDirectConversation(supabase, userId, tenantUserId);

        if (!conversationId) {
            return NextResponse.json({ conversationId: null, tenantUserId, messages: [] });
        }

        // 4. Fetch the most recent 8 messages directly (Lightning fast)
        const { data: rawMessages } = await supabase
            .from("messages")
            .select("id, conversation_id, sender_id, type, content, metadata, read_at, created_at")
            .eq("conversation_id", conversationId)
            .order("created_at", { ascending: false })
            .limit(8);

        const DEFAULT_FILES_BUCKET = "message-files";
        const messages = await Promise.all(
            (rawMessages ?? []).slice().reverse().map(async (m) => {
                let imageUrl: string | null = null;
                let metadata: any = m.metadata;
                if (typeof metadata === "string") {
                    try { metadata = JSON.parse(metadata); } catch {}
                }

                if (metadata && typeof metadata === "object") {
                    if (typeof metadata.fileUrl === "string" && metadata.fileUrl.length > 0) {
                        imageUrl = metadata.fileUrl;
                    } else if (typeof metadata.filePath === "string" && metadata.filePath.length > 0) {
                        const bucket = typeof metadata.bucket === "string" ? metadata.bucket : DEFAULT_FILES_BUCKET;
                        try {
                            const { data: signedData } = await supabase.storage
                                .from(bucket)
                                .createSignedUrl(metadata.filePath, 3600);
                            if (signedData?.signedUrl) {
                                imageUrl = signedData.signedUrl;
                            }
                        } catch {}
                    } else if (Array.isArray(metadata.attachments) && metadata.attachments.length > 0) {
                        const firstAtt = metadata.attachments[0];
                        if (firstAtt?.fileUrl) {
                            imageUrl = firstAtt.fileUrl;
                        } else if (firstAtt?.filePath) {
                            const bucket = typeof firstAtt.bucket === "string" ? firstAtt.bucket : DEFAULT_FILES_BUCKET;
                            try {
                                const { data: signedData } = await supabase.storage
                                    .from(bucket)
                                    .createSignedUrl(firstAtt.filePath, 3600);
                                if (signedData?.signedUrl) {
                                    imageUrl = signedData.signedUrl;
                                }
                            } catch {}
                        }
                    }
                }

                // Check if content is an image filename or URL directly
                const isImageExtension = typeof m.content === "string" && /\.(png|jpe?g|webp|gif|svg)$/i.test(m.content.trim());

                // Fallback: If no signed URL yet but it's an image file, scan conversation folder in storage
                if (!imageUrl && isImageExtension) {
                    try {
                        const { data: files } = await supabase.storage.from(DEFAULT_FILES_BUCKET).list(conversationId);
                        const matched = (files ?? []).find((f) => f.name === m.content || f.name.endsWith(m.content));
                        if (matched) {
                            const { data: signedData } = await supabase.storage
                                .from(DEFAULT_FILES_BUCKET)
                                .createSignedUrl(`${conversationId}/${matched.name}`, 3600);
                            if (signedData?.signedUrl) {
                                imageUrl = signedData.signedUrl;
                            }
                        }
                    } catch {}
                }

                return {
                    id: m.id,
                    sender_id: m.sender_id,
                    type: m.type,
                    content: m.content,
                    imageUrl,
                    isImage: Boolean(m.type === "image" || imageUrl || isImageExtension),
                    created_at: m.created_at,
                    is_outgoing: m.sender_id === userId,
                };
            })
        );

        return NextResponse.json({
            conversationId,
            tenantUserId,
            messages,
        });
    } catch (error) {
        console.error("[UnitMessages] Fast fetch error:", error);
        return NextResponse.json({ error: "Failed to fetch unit messages" }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    const authContext = await requireAuthenticatedUser(request);
    if (!("userId" in authContext)) return authContext as any;
    const { userId } = authContext;

    try {
        const parsed = await parseJsonBody(request, unitMessageSendSchema);
        if (!parsed.ok) return parsed.response;
        const { unitId, tenantUserId: providedTenantId, conversationId: providedConvId, content: trimmedContent } = parsed.data;

        const supabase = createServiceRoleSupabaseClient();
        let convId = providedConvId ?? null;

        if (convId) {
            // Only post into conversations the landlord is part of.
            const isMember = await ensureUserInConversation(supabase, convId, userId);
            if (!isMember) {
                return NextResponse.json({ error: "Conversation not found." }, { status: 404 });
            }
        } else {
            // Create conversation if needed
            let targetTenantId = providedTenantId ?? null;
            if (targetTenantId && !(await isLandlordTenant(supabase, userId, targetTenantId))) {
                return NextResponse.json({ error: "You can only message your own tenants." }, { status: 403 });
            }
            if (!targetTenantId && unitId) {
                targetTenantId = await findTenantForOwnedUnit(supabase, userId, unitId);
            }

            if (!targetTenantId) {
                return NextResponse.json({ error: "Cannot identify tenant for this message" }, { status: 400 });
            }

            // Check if conversation already exists
            const existingId = await findDirectConversation(supabase, userId, targetTenantId);
            if (existingId) {
                convId = existingId;
            } else {
                // Insert new conversation
                convId = crypto.randomUUID();
                await supabase.from("conversations").insert({ id: convId });
                await supabase.from("conversation_participants").insert([
                    { conversation_id: convId, user_id: userId },
                    { conversation_id: convId, user_id: targetTenantId },
                ]);
            }
        }

        // Insert message
        const messageId = crypto.randomUUID();
        const { data: insertedMsg, error: insertError } = await supabase
            .from("messages")
            .insert({
                id: messageId,
                conversation_id: convId,
                sender_id: userId,
                content: trimmedContent,
                type: "text",
            })
            .select("id, conversation_id, sender_id, type, content, created_at")
            .single();

        if (insertError) {
            console.error("[UnitMessages] Insert error:", insertError);
            return NextResponse.json({ error: "Failed to send message" }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            conversationId: convId,
            message: {
                id: insertedMsg.id,
                sender_id: insertedMsg.sender_id,
                content: insertedMsg.content,
                created_at: insertedMsg.created_at,
                is_outgoing: true,
            },
        });
    } catch (error) {
        console.error("[UnitMessages] Send error:", error);
        return NextResponse.json({ error: "Failed to send message" }, { status: 500 });
    }
}
