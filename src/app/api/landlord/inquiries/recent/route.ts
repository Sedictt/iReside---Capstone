import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type InquiryItem = {
    id: string;
    prospectName: string;
    prospectAvatar: string | null;
    propertyName: string;
    propertyImage: string;
    messagePreview: string;
    timestamp: string;
    isUnread: boolean;
};

const FALLBACK_PROPERTY_IMAGE =
    "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&h=600&fit=crop";

const formatRelativeDate = (value: string) => {
    const date = new Date(value);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();

    if (Number.isNaN(diffMs) || diffMs < 0) return "Recently";

    const minute = 60 * 1000;
    const hour = 60 * minute;
    const day = 24 * hour;

    if (diffMs < hour) {
        const minutes = Math.max(1, Math.floor(diffMs / minute));
        return `${minutes} minute${minutes === 1 ? "" : "s"} ago`;
    }

    if (diffMs < day) {
        const hours = Math.max(1, Math.floor(diffMs / hour));
        return `${hours} hour${hours === 1 ? "" : "s"} ago`;
    }

    const days = Math.floor(diffMs / day);
    if (days === 1) return "Yesterday";
    if (days < 7) return `${days} days ago`;

    return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
    });
};

export async function GET() {
    const supabase = await createClient();

    const {
        data: { user },
        error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: inquiryRows, error } = await supabase
        .from("applications")
        .select("id, status, message, created_at, applicant_id, unit_id")
        .eq("landlord_id", user.id)
        .not("message", "is", null)
        .order("created_at", { ascending: false })
        .limit(8);

    if (error) {
        return NextResponse.json({ error: "Failed to fetch recent inquiries." }, { status: 500 });
    }

    const inquiryIds = (inquiryRows ?? []).map((row) => row.id);

    const applicantIds = Array.from(
        new Set((inquiryRows ?? []).map((row) => row.applicant_id).filter((value): value is string => Boolean(value)))
    );
    const unitIds = Array.from(
        new Set((inquiryRows ?? []).map((row) => row.unit_id).filter((value): value is string => Boolean(value)))
    );

    const { data: applicantRows, error: applicantsError } =
        applicantIds.length > 0
            ? await supabase.from("profiles").select("id, full_name, avatar_url").in("id", applicantIds)
            : { data: [], error: null };

    if (applicantsError) {
        return NextResponse.json({ error: "Failed to fetch applicants." }, { status: 500 });
    }

    const { data: unitRows, error: unitsError } =
        unitIds.length > 0
            ? await supabase.from("units").select("id, name, property_id").in("id", unitIds)
            : { data: [], error: null };

    if (unitsError) {
        return NextResponse.json({ error: "Failed to fetch units." }, { status: 500 });
    }

    const propertyIds = Array.from(
        new Set((unitRows ?? []).map((row) => row.property_id).filter((value): value is string => Boolean(value)))
    );

    const { data: propertyRows, error: propertiesError } =
        propertyIds.length > 0
            ? await supabase.from("properties").select("id, name, images").in("id", propertyIds)
            : { data: [], error: null };

    if (propertiesError) {
        return NextResponse.json({ error: "Failed to fetch properties." }, { status: 500 });
    }

    const { data: actionRows, error: actionsError } =
        inquiryIds.length > 0
            ? await supabase
                  .from("landlord_inquiry_actions")
                  .select("inquiry_id, is_read, is_archived, deleted_at")
                  .eq("landlord_id", user.id)
                  .in("inquiry_id", inquiryIds)
            : { data: [], error: null };

    if (actionsError) {
        return NextResponse.json({ error: "Failed to fetch inquiry actions." }, { status: 500 });
    }

    const actionMap = new Map(
        (actionRows ?? []).map((row) => [
            row.inquiry_id,
            {
                is_read: row.is_read,
                is_archived: row.is_archived,
                deleted_at: row.deleted_at,
            },
        ])
    );

    const applicantMap = new Map((applicantRows ?? []).map((row) => [row.id, row]));
    const unitMap = new Map((unitRows ?? []).map((row) => [row.id, row]));
    const propertyMap = new Map((propertyRows ?? []).map((row) => [row.id, row]));

    const inquiries: InquiryItem[] = (inquiryRows ?? [])
        .filter((row) => {
            const action = actionMap.get(row.id);
            if (!action) return true;

            return !action.is_archived && !action.deleted_at;
        })
        .filter((row) => typeof row.message === "string" && row.message.trim().length > 0)
        .map((row) => {
            const action = actionMap.get(row.id);
            const applicant = applicantMap.get(row.applicant_id);
            const unit = unitMap.get(row.unit_id);
            const property = unit ? propertyMap.get(unit.property_id) : null;
            const propertyImages = property?.images;
            const propertyImage =
                Array.isArray(propertyImages) && typeof propertyImages[0] === "string" && propertyImages[0].trim().length > 0
                    ? propertyImages[0]
                    : FALLBACK_PROPERTY_IMAGE;

            return {
                id: row.id,
                prospectName: applicant?.full_name ?? "Unknown prospect",
                prospectAvatar: applicant?.avatar_url ?? null,
                propertyName: property?.name || unit?.name || "Property inquiry",
                propertyImage,
                messagePreview: row.message ?? "No message",
                timestamp: formatRelativeDate(row.created_at),
                isUnread: !(action?.is_read ?? false),
            };
        });

    return NextResponse.json({ inquiries });
}
