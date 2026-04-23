import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { ensureUserInConversation, getProfilePreviewMap } from "@/lib/messages/engine";
import type { Database, PaymentMethod, PaymentStatus } from "@/types/database";

type PaymentHistoryEntry = {
    id: string;
    amount: number;
    statusLabel: string;
    statusTone: "paid" | "pending" | "failed" | "refunded";
    methodLabel: string;
    typeLabel: string;
    monthLabel: string;
    dateLabel: string;
};

const METHOD_LABELS: Record<PaymentMethod, string> = {
    credit_card: "Credit Card",
    debit_card: "Debit Card",
    gcash: "GCash",
    maya: "Maya",
    bank_transfer: "Bank Transfer",
    cash: "Cash",
};

const buildStatusLabel = (
    status: PaymentStatus,
    workflowStatus: Database["public"]["Enums"]["payment_workflow_status"],
    landlordConfirmed: boolean,
) => {
    if (workflowStatus === "reminder_sent") return "Reminder Sent";
    if (workflowStatus === "intent_submitted") return "Intent Submitted";
    if (workflowStatus === "under_review") return "Under Review";
    if (workflowStatus === "awaiting_in_person") return "Awaiting In-Person";
    if (workflowStatus === "confirmed") return "Confirmed";
    if (workflowStatus === "rejected") return "Rejected";
    if (workflowStatus === "receipted") return "Receipted";

    if (status === "processing") {
        return "Under Review";
    }
    if (status === "completed") {
        return landlordConfirmed ? "Paid" : "Pending Verification";
    }
    if (status === "failed") {
        return "Failed";
    }
    if (status === "refunded") {
        return "Refunded";
    }
    return "Pending";
};

const buildStatusTone = (
    status: PaymentStatus,
    workflowStatus: Database["public"]["Enums"]["payment_workflow_status"],
    landlordConfirmed: boolean,
): PaymentHistoryEntry["statusTone"] => {
    if (workflowStatus === "rejected") return "failed";
    if (workflowStatus === "receipted" || workflowStatus === "confirmed") return "paid";
    if (status === "completed" && landlordConfirmed) {
        return "paid";
    }
    if (status === "failed") {
        return "failed";
    }
    if (status === "refunded") {
        return "refunded";
    }
    return "pending";
};

const formatDateLabel = (value: string) => {
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
        return "Unknown date";
    }

    return parsed.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
    });
};

const formatMonthLabel = (value: string) => {
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
        return "Unknown month";
    }

    return parsed.toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
    });
};

const deriveTypeLabel = (description: string | null) => {
    if (!description) {
        return "Payment";
    }

    const normalized = description.trim();
    if (!normalized) {
        return "Payment";
    }

    const lower = normalized.toLowerCase();
    if (lower.includes("deposit")) {
        return "Security Deposit";
    }
    if (lower.includes("rent")) {
        return "Rent";
    }
    if (lower.includes("utility") || lower.includes("water") || lower.includes("electric")) {
        return "Utilities";
    }

    return normalized;
};

export async function GET(
    request: Request,
    context: { params: Promise<{ conversationId: string }> }
) {
    const authClient = await createClient();

    const {
        data: { user },
        error: userError,
    } = await authClient.auth.getUser();

    if (userError || !user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { conversationId } = await context.params;

    try {
        const supabase = createAdminClient();
        const isMember = await ensureUserInConversation(supabase, conversationId, user.id);
        if (!isMember) {
            return NextResponse.json({ error: "Conversation not found." }, { status: 404 });
        }

        const { data: participantRows, error: participantError } = await supabase
            .from("conversation_participants")
            .select("user_id")
            .eq("conversation_id", conversationId);

        if (participantError) {
            return NextResponse.json({ error: "Failed to load participants." }, { status: 500 });
        }

        const participantIds = (participantRows ?? []).map((row) => row.user_id);
        const profileMap = await getProfilePreviewMap(supabase, participantIds);

        const participants = participantIds
            .map((id) => profileMap.get(id))
            .flatMap((profile) => (profile ? [profile] : []));

        const tenant = participants.find((profile) => profile.role === "tenant") ?? null;
        const landlord = participants.find((profile) => profile.role === "landlord") ?? null;

        if (!tenant || !landlord) {
            return NextResponse.json({ payments: [], totalPaid: 0 });
        }

        const url = new URL(request.url);
        const limitParam = Number(url.searchParams.get("limit") ?? "50");
        const limit = Number.isFinite(limitParam) ? Math.max(1, Math.min(200, Math.floor(limitParam))) : 50;

        const { data: payments, error: paymentsError } = await supabase
            .from("payments")
            .select("id, amount, status, workflow_status, method, description, due_date, paid_at, landlord_confirmed, created_at")
            .eq("tenant_id", tenant.id)
            .eq("landlord_id", landlord.id)
            .order("due_date", { ascending: false })
            .limit(limit);

        if (paymentsError) {
            return NextResponse.json({ error: "Failed to fetch payment history." }, { status: 500 });
        }

        const mapped = (payments ?? []).map((payment) => {
            const eventDate = payment.paid_at ?? payment.due_date ?? payment.created_at;

            return {
                id: payment.id,
                amount: Number(payment.amount ?? 0),
                statusLabel: buildStatusLabel(
                    payment.status,
                    payment.workflow_status,
                    Boolean(payment.landlord_confirmed),
                ),
                statusTone: buildStatusTone(
                    payment.status,
                    payment.workflow_status,
                    Boolean(payment.landlord_confirmed),
                ),
                methodLabel: payment.method ? METHOD_LABELS[payment.method] ?? "Manual" : "Manual",
                typeLabel: deriveTypeLabel(payment.description),
                monthLabel: formatMonthLabel(eventDate),
                dateLabel: formatDateLabel(eventDate),
            } satisfies PaymentHistoryEntry;
        });

        const totalPaid = (payments ?? []).reduce((sum, payment) => {
            if (payment.status === "completed" && payment.landlord_confirmed) {
                return sum + Number(payment.amount ?? 0);
            }
            return sum;
        }, 0);

        return NextResponse.json({ payments: mapped, totalPaid });
    } catch (error) {
        console.error("Failed to fetch payment history:", error);
        return NextResponse.json({ error: "Failed to fetch payment history." }, { status: 500 });
    }
}
